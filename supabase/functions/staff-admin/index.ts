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
  action: "list" | "create" | "revoke";
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

  if (body.action === "list") {
    return handleList(adminClient);
  }

  if (body.action === "create") {
    return handleCreate(adminClient, callerRole, body);
  }

  if (body.action === "revoke") {
    return handleRevoke(adminClient, callerRole, body);
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
    admin_id: created.user.id,
    action_type: "create_staff",
    description: `Created ${role} account "${username}".`,
  });

  return jsonResponse({ data: { id: created.user.id, username, email, role }, error: null });
}

async function handleRevoke(
  adminClient: SupabaseClient,
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
    admin_id: id,
    action_type: "revoke_staff",
    description: `Revoked access for "${target.username}".`,
  });

  return jsonResponse({ data: { id }, error: null });
}
