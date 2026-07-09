// Hotel Kamala Inn Grand — Staff Management Edge Function
//
// Client-side code only ever holds the anon key, and `staff_roles` has no
// insert/update/delete RLS policy by design (writes are reserved for
// server-side logic — see supabase/migrations/0001_init_schema.sql). Creating
// a Supabase Auth user with an admin-chosen password, banning a login, and
// writing staff_roles all require the service-role key, which Supabase
// injects automatically into this function's runtime as
// SUPABASE_SERVICE_ROLE_KEY — it is never stored in .env or shipped to the
// browser.
//
// Every action re-derives the caller's real role from their own JWT via the
// `current_staff_role()` RPC before doing anything privileged. The client
// never gets to assert its own role.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.110.0";

type StaffRoleType = "master_admin" | "head_admin" | "sub_admin";

interface StaffAdminRequest {
  action: "list" | "create" | "revoke" | "update" | "delete";
  username?: string;
  email?: string;
  password?: string;
  role?: StaffRoleType;
  id?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function errorResponse(code: string, message: string, status: number): Response {
  return jsonResponse({ data: null, error: { code, message } }, status);
}

// Mirrors the client-side canActOn() check in StaffManagementPanel.tsx — this
// copy is the authoritative one. Keep both in sync if the hierarchy changes.
function canCreate(callerRole: StaffRoleType, targetRole: StaffRoleType): boolean {
  if (targetRole === "master_admin") return false;
  if (callerRole === "master_admin") return true;
  if (callerRole === "head_admin") return targetRole === "sub_admin";
  return false;
}

function canRevoke(callerRole: StaffRoleType, targetRole: StaffRoleType): boolean {
  if (targetRole === "master_admin") return false;
  if (callerRole === "master_admin") return true;
  if (callerRole === "head_admin") return targetRole === "sub_admin";
  return false;
}

// Editing another account's credentials and hard-deleting it outright are
// more destructive than create/revoke, so — per spec — both are restricted
// to master_admin only, regardless of the target's role. A master_admin can
// still never target another master_admin account this way (the
// single-Master-Administrator invariant from Section 2.4), and self-service
// profile changes go through supabase.auth.updateUser() client-side instead
// of this function, so this never needs to allow "edit yourself".
function canHardModify(callerRole: StaffRoleType, targetRole: StaffRoleType): boolean {
  if (targetRole === "master_admin") return false;
  return callerRole === "master_admin";
}

async function getCallerRole(
  authHeader: string,
): Promise<{ role: StaffRoleType | null; error: string | null }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await callerClient.rpc("current_staff_role");
  if (error) return { role: null, error: error.message };
  return { role: (data as StaffRoleType) ?? null, error: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse("unauthenticated", "Missing authorization header.", 401);
  }

  const { role: callerRole, error: roleError } = await getCallerRole(authHeader);
  if (roleError || !callerRole) {
    return errorResponse("unauthenticated", "Could not verify staff session.", 401);
  }
  if (callerRole === "sub_admin") {
    return errorResponse("forbidden", "You do not have access to staff management.", 403);
  }

  let body: StaffAdminRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse("bad_request", "Invalid JSON body.", 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

  // The audit trail must attribute create/revoke to whoever is actually
  // executing the action, not the account being created or revoked — same
  // JWT `sub`-claim extraction verify-reservation/index.ts already uses for
  // its own audit inserts.
  const jwtPayload = JSON.parse(atob(authHeader.replace("Bearer ", "").split(".")[1]));
  const callerId = jwtPayload.sub as string;

  if (body.action === "list") {
    return handleList(adminClient);
  }

  if (body.action === "create") {
    return handleCreate(adminClient, callerId, callerRole, body);
  }

  if (body.action === "revoke") {
    return handleRevoke(adminClient, callerId, callerRole, body);
  }

  if (body.action === "update") {
    return handleUpdate(adminClient, callerId, callerRole, body);
  }

  if (body.action === "delete") {
    return handleDelete(adminClient, callerId, callerRole, body);
  }

  return errorResponse("bad_request", "Unknown action.", 400);
});

async function handleList(adminClient: SupabaseClient): Promise<Response> {
  const { data: staffRows, error: staffError } = await adminClient
    .from("staff_roles")
    .select("id, username, role, created_at, deactivated_at")
    .order("created_at", { ascending: true });

  if (staffError) {
    return errorResponse("db_error", staffError.message, 500);
  }

  const { data: usersPage, error: usersError } = await adminClient.auth.admin.listUsers({
    perPage: 200,
  });

  if (usersError) {
    return errorResponse("auth_error", usersError.message, 500);
  }

  const emailById = new Map(usersPage.users.map((u) => [u.id, u.email ?? ""]));

  const staff = (staffRows ?? []).map((row) => ({
    ...row,
    email: emailById.get(row.id) ?? "",
  }));

  return jsonResponse({ data: staff, error: null });
}

async function handleCreate(
  adminClient: SupabaseClient,
  callerId: string,
  callerRole: StaffRoleType,
  body: StaffAdminRequest,
): Promise<Response> {
  const { username, email, password, role } = body;

  if (!username || !email || !password || !role) {
    return errorResponse("bad_request", "username, email, password, and role are required.", 400);
  }
  if (role !== "head_admin" && role !== "sub_admin") {
    return errorResponse("bad_request", "role must be head_admin or sub_admin.", 400);
  }
  if (!canCreate(callerRole, role)) {
    return errorResponse(
      "forbidden",
      "You do not have permission to create an account with that role.",
      403,
    );
  }

  const { data: existingUsername } = await adminClient
    .from("staff_roles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUsername) {
    return errorResponse("duplicate_username", "That username is already in use.", 409);
  }

  const { data: usersPage, error: usersError } = await adminClient.auth.admin.listUsers({
    perPage: 200,
  });
  if (usersError) {
    return errorResponse("auth_error", usersError.message, 500);
  }
  if (usersPage.users.some((u) => u.email?.toLowerCase() === email.toLowerCase())) {
    return errorResponse("duplicate_email", "That email is already registered.", 409);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return errorResponse("auth_error", createError?.message ?? "Could not create account.", 500);
  }

  const { error: insertError } = await adminClient.from("staff_roles").insert({
    id: created.user.id,
    username,
    role,
  });

  if (insertError) {
    // Compensating action: don't leave an orphaned auth user with no staff_roles row.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return errorResponse("db_error", insertError.message, 500);
  }

  await adminClient.from("audit_logs").insert({
    admin_id: callerId,
    action_type: "create_staff",
    description: `Created ${role} account "${username}".`,
    // actor_role's column default (current_staff_role()) resolves to null
    // under the service-role client, so it's set explicitly here — same
    // pattern as verify-reservation/index.ts's audit inserts.
    actor_role: callerRole,
    new_value: { id: created.user.id, username, role },
  });

  return jsonResponse({ data: { id: created.user.id, username, email, role }, error: null });
}

async function handleRevoke(
  adminClient: SupabaseClient,
  callerId: string,
  callerRole: StaffRoleType,
  body: StaffAdminRequest,
): Promise<Response> {
  const { id } = body;
  if (!id) {
    return errorResponse("bad_request", "id is required.", 400);
  }

  const { data: target, error: targetError } = await adminClient
    .from("staff_roles")
    .select("id, username, role, deactivated_at")
    .eq("id", id)
    .maybeSingle();

  if (targetError || !target) {
    return errorResponse("not_found", "Staff account not found.", 404);
  }
  if (target.deactivated_at) {
    return errorResponse("already_revoked", "This account is already deactivated.", 409);
  }
  if (!canRevoke(callerRole, target.role as StaffRoleType)) {
    return errorResponse(
      "forbidden",
      "You do not have permission to revoke this account.",
      403,
    );
  }

  const { error: banError } = await adminClient.auth.admin.updateUserById(id, {
    ban_duration: "876000h",
  });
  if (banError) {
    return errorResponse("auth_error", banError.message, 500);
  }

  const { error: updateError } = await adminClient
    .from("staff_roles")
    .update({ deactivated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return errorResponse("db_error", updateError.message, 500);
  }

  await adminClient.from("audit_logs").insert({
    admin_id: callerId,
    action_type: "revoke_staff",
    description: `Revoked access for "${target.username}".`,
    actor_role: callerRole,
    old_value: { id: target.id, username: target.username, role: target.role },
  });

  return jsonResponse({ data: { id }, error: null });
}

async function handleUpdate(
  adminClient: SupabaseClient,
  callerId: string,
  callerRole: StaffRoleType,
  body: StaffAdminRequest,
): Promise<Response> {
  const { id, username, email, password } = body;
  if (!id) {
    return errorResponse("bad_request", "id is required.", 400);
  }
  if (!username && !email && !password) {
    return errorResponse(
      "bad_request",
      "At least one of username, email, or password must be provided.",
      400,
    );
  }
  if (password && password.length < 6) {
    return errorResponse("bad_request", "Password must be at least 6 characters.", 400);
  }

  const { data: target, error: targetError } = await adminClient
    .from("staff_roles")
    .select("id, username, role")
    .eq("id", id)
    .maybeSingle();

  if (targetError || !target) {
    return errorResponse("not_found", "Staff account not found.", 404);
  }

  // A "My Profile" self-edit is always permitted for the caller's own
  // account (Section 5.4-adjacent: every role, including master_admin,
  // manages their own credentials this way) — canHardModify only gates
  // editing *someone else's* account, and specifically blocks any caller
  // from targeting a master_admin account other than their own.
  const isSelfEdit = id === callerId;
  if (!isSelfEdit && !canHardModify(callerRole, target.role as StaffRoleType)) {
    return errorResponse(
      "forbidden",
      "You do not have permission to edit this account.",
      403,
    );
  }

  if (username && username !== target.username) {
    const { data: existingUsername } = await adminClient
      .from("staff_roles")
      .select("id")
      .eq("username", username)
      .neq("id", id)
      .maybeSingle();

    if (existingUsername) {
      return errorResponse("duplicate_username", "That username is already in use.", 409);
    }
  }

  if (email || password) {
    const authUpdate: { email?: string; password?: string } = {};
    if (email) authUpdate.email = email;
    if (password) authUpdate.password = password;

    const { error: authError } = await adminClient.auth.admin.updateUserById(id, authUpdate);
    if (authError) {
      return errorResponse("auth_error", authError.message, 500);
    }
  }

  if (username && username !== target.username) {
    const { error: usernameError } = await adminClient
      .from("staff_roles")
      .update({ username })
      .eq("id", id);

    if (usernameError) {
      return errorResponse("db_error", usernameError.message, 500);
    }
  }

  const changedFields = [
    username && username !== target.username ? "username" : null,
    email ? "email" : null,
    password ? "password" : null,
  ].filter(Boolean);

  await adminClient.from("audit_logs").insert({
    admin_id: callerId,
    action_type: "update_staff_profile",
    description: `Updated ${changedFields.join(", ")} for "${target.username}".`,
    actor_role: callerRole,
    old_value: { id: target.id, username: target.username },
    new_value: { id: target.id, username: username ?? target.username },
  });

  return jsonResponse({ data: { id }, error: null });
}

async function handleDelete(
  adminClient: SupabaseClient,
  callerId: string,
  callerRole: StaffRoleType,
  body: StaffAdminRequest,
): Promise<Response> {
  const { id } = body;
  if (!id) {
    return errorResponse("bad_request", "id is required.", 400);
  }

  const { data: target, error: targetError } = await adminClient
    .from("staff_roles")
    .select("id, username, role")
    .eq("id", id)
    .maybeSingle();

  if (targetError || !target) {
    return errorResponse("not_found", "Staff account not found.", 404);
  }
  if (!canHardModify(callerRole, target.role as StaffRoleType)) {
    return errorResponse(
      "forbidden",
      "You do not have permission to delete this account.",
      403,
    );
  }

  // The audit_logs insert below reads target.username, so the staff_roles
  // row is deleted only after that read — deleting auth.users first would
  // cascade-delete staff_roles automatically (0001_init_schema.sql:19), but
  // deleting it explicitly here keeps the two steps in a predictable,
  // logged order rather than relying on an implicit cascade.
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id);
  if (deleteAuthError) {
    return errorResponse("auth_error", deleteAuthError.message, 500);
  }

  const { error: deleteRoleError } = await adminClient
    .from("staff_roles")
    .delete()
    .eq("id", id);

  if (deleteRoleError) {
    console.error(
      `[staff-admin] auth user ${id} was deleted, but the staff_roles row could not be removed (likely already cascaded):`,
      deleteRoleError.message,
    );
  }

  await adminClient.from("audit_logs").insert({
    admin_id: callerId,
    action_type: "delete_staff",
    description: `Permanently deleted ${target.role} account "${target.username}".`,
    actor_role: callerRole,
    old_value: { id: target.id, username: target.username, role: target.role },
  });

  return jsonResponse({ data: { id }, error: null });
}
