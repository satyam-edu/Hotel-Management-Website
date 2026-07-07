// Hotel Kamala Inn Grand — Server-Side Reservation Billing Verification
//
// Blueprint Section 2.9: billing math (nights, taxable amount, tax, total)
// must never be trusted from the browser. Previously WalkInBookingModal and
// EditLedgerModal computed these figures client-side and wrote them straight
// to `reservations` — anyone with devtools open could submit a fabricated
// total. This function is now the only path that creates or edits the money
// fields on a reservation: it independently re-derives the authoritative
// nightly rate from `room_categories` (via `physical_rooms.room_number` ->
// `physical_rooms.category_id` -> `room_categories.id`, since that's the only
// FK chain that actually resolves a rate — `reservations.assigned_room_id` is
// unused/vestigial, see 0002_reservations_walkin_fields.sql) and the current
// `system_configurations.tax_rate`, and only ever writes its own computed
// values — whatever the client sent for total_amount/tax_amount is discarded,
// never trusted, and logged if it disagreed.
//
// Mirrors supabase/functions/staff-admin/index.ts's structural conventions:
// same CORS headers, same {data,error} envelope, same "derive caller role
// from their own JWT via current_staff_role(), never trust a client-asserted
// role" pattern, service-role client only after that check passes.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.110.0";

type StaffRoleType = "master_admin" | "head_admin" | "sub_admin";
type PaymentStatus = "unpaid" | "partial" | "paid";

interface VerifyReservationRequest {
  action: "create" | "update";
  reservation_id?: string; // required for "update"
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  adults?: number;
  children?: number;
  discount_amount?: number;
  amount_received?: number;
  payment_status_override?: PaymentStatus; // "paid"/"unpaid" force full/zero payment
  guest_name?: string;
  guest_phone?: string;
  internal_notes?: string;
  from_enquiry_id?: string;
  // Client-sent figures, kept only so we can log whether they matched.
  client_total_amount?: number;
  client_tax_amount?: number;
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

function countNights(checkIn: string, checkOut: string): number {
  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24),
  );
  return nights > 0 ? nights : 0;
}

interface BillingBreakdown {
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

// Same formula as src/lib/billing.ts's computeBilling — kept in sync deliberately,
// since this is now the authoritative copy and that one is preview-only.
function computeBilling(
  subtotal: number,
  discountAmount: number,
  taxRatePercent: number,
): BillingBreakdown {
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = taxableAmount * (taxRatePercent / 100);
  const total = taxableAmount + taxAmount;
  return { taxableAmount, taxAmount, total };
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
    return errorResponse(
      "forbidden",
      "You do not have access to create or edit reservations.",
      403,
    );
  }

  let body: VerifyReservationRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse("bad_request", "Invalid JSON body.", 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

  // Every extracted authorization header carries the caller's own user id via
  // the JWT `sub` claim — used for the audit log's admin_id, same as
  // staff-admin's handleCreate/handleRevoke.
  const jwtPayload = JSON.parse(atob(authHeader.replace("Bearer ", "").split(".")[1]));
  const callerId = jwtPayload.sub as string;

  if (body.action === "create") {
    return handleCreate(adminClient, callerId, body);
  }

  if (body.action === "update") {
    return handleUpdate(adminClient, callerId, body);
  }

  return errorResponse("bad_request", "Unknown action.", 400);
});

async function loadAuthoritativeRate(
  adminClient: SupabaseClient,
  roomNumber: string,
): Promise<{ nightlyRate: number | null; error: string | null }> {
  const { data, error } = await adminClient
    .from("physical_rooms")
    .select("room_categories(nightly_rate)")
    .eq("room_number", roomNumber)
    .maybeSingle();

  if (error) return { nightlyRate: null, error: error.message };
  if (!data) return { nightlyRate: null, error: `Room ${roomNumber} does not exist.` };

  const category = (data as { room_categories: { nightly_rate: number } | null })
    .room_categories;
  if (!category) {
    return { nightlyRate: null, error: `Room ${roomNumber} has no assigned category.` };
  }

  return { nightlyRate: category.nightly_rate, error: null };
}

async function loadTaxRate(
  adminClient: SupabaseClient,
): Promise<{ taxRatePercent: number | null; error: string | null }> {
  const { data, error } = await adminClient
    .from("system_configurations")
    .select("tax_rate")
    .eq("id", 1)
    .maybeSingle();

  if (error) return { taxRatePercent: null, error: error.message };
  if (!data) return { taxRatePercent: null, error: "System configuration is not seeded." };

  return { taxRatePercent: data.tax_rate as number, error: null };
}

function reconcilePaymentStatus(
  amountPaid: number,
  total: number,
): PaymentStatus {
  if (amountPaid >= total) return "paid";
  if (amountPaid <= 0) return "unpaid";
  return "partial";
}

function resolveAmountPaid(
  billing: BillingBreakdown,
  paymentStatusOverride: PaymentStatus | undefined,
  amountReceived: number,
): number {
  if (paymentStatusOverride === "paid") return billing.total;
  if (paymentStatusOverride === "unpaid") return 0;
  return Math.min(Math.max(amountReceived, 0), billing.total);
}

function logVerification(
  context: string,
  roomNumber: string,
  serverBilling: BillingBreakdown,
  clientTotal: number | undefined,
  clientTax: number | undefined,
): void {
  const totalMatched =
    clientTotal === undefined || Math.abs(clientTotal - serverBilling.total) < 0.01;
  const taxMatched =
    clientTax === undefined || Math.abs(clientTax - serverBilling.taxAmount) < 0.01;

  if (totalMatched && taxMatched) {
    console.log(
      `[verify-reservation] ${context} room=${roomNumber}: client figures matched server calculation (total=${serverBilling.total.toFixed(2)}, tax=${serverBilling.taxAmount.toFixed(2)}).`,
    );
    return;
  }

  console.warn(
    `[verify-reservation] ${context} room=${roomNumber}: OVERRIDDEN — client sent total=${clientTotal ?? "n/a"}/tax=${clientTax ?? "n/a"}, server computed total=${serverBilling.total.toFixed(2)}/tax=${serverBilling.taxAmount.toFixed(2)}. Server values are authoritative and were used.`,
  );
}

async function handleCreate(
  adminClient: SupabaseClient,
  callerId: string,
  body: VerifyReservationRequest,
): Promise<Response> {
  const { room_number, check_in_date, check_out_date } = body;

  if (!room_number || !check_in_date || !check_out_date || !body.guest_name || !body.guest_phone) {
    return errorResponse(
      "bad_request",
      "room_number, check_in_date, check_out_date, guest_name, and guest_phone are required.",
      400,
    );
  }

  const nights = countNights(check_in_date, check_out_date);
  if (nights <= 0) {
    return errorResponse("bad_request", "check_out_date must be after check_in_date.", 400);
  }

  const { nightlyRate, error: rateError } = await loadAuthoritativeRate(adminClient, room_number);
  if (rateError || nightlyRate === null) {
    return errorResponse("not_found", rateError ?? "Could not resolve room rate.", 404);
  }

  const { taxRatePercent, error: taxError } = await loadTaxRate(adminClient);
  if (taxError || taxRatePercent === null) {
    return errorResponse("db_error", taxError ?? "Could not resolve tax rate.", 500);
  }

  // Re-verify availability server-side too — a client-side check moments
  // earlier can't be trusted not to have raced another booking in between.
  const { data: overlapping, error: overlapError } = await adminClient
    .from("reservations")
    .select("id")
    .eq("room_number", room_number)
    .in("status", ["Confirmed", "Checked-In"])
    .lt("check_in_date", check_out_date)
    .gt("check_out_date", check_in_date)
    .limit(1);

  if (overlapError) {
    return errorResponse("db_error", overlapError.message, 500);
  }
  if (overlapping && overlapping.length > 0) {
    return errorResponse(
      "room_unavailable",
      `Room ${room_number} is already occupied or booked for these dates.`,
      409,
    );
  }

  const discountAmount = Math.max(body.discount_amount ?? 0, 0);
  const subtotal = nightlyRate * nights;
  const billing = computeBilling(subtotal, discountAmount, taxRatePercent);

  const amountPaid = resolveAmountPaid(
    billing,
    body.payment_status_override,
    body.amount_received ?? 0,
  );
  const reconciledStatus = reconcilePaymentStatus(amountPaid, billing.total);

  logVerification("create", room_number, billing, body.client_total_amount, body.client_tax_amount);

  const { data: inserted, error: insertError } = await adminClient
    .from("reservations")
    .insert({
      guest_name: body.guest_name,
      guest_phone: body.guest_phone,
      room_number,
      check_in_date,
      check_out_date,
      adults: body.adults ?? 1,
      children: body.children ?? 0,
      total_amount: billing.total,
      tax_amount: billing.taxAmount,
      discount_amount: discountAmount,
      amount_paid: amountPaid,
      payment_status: reconciledStatus,
      internal_notes: body.internal_notes ?? "",
      status: "Confirmed",
    })
    .select()
    .single();

  if (insertError) {
    return errorResponse("db_error", insertError.message, 500);
  }

  await adminClient.from("audit_logs").insert({
    admin_id: callerId,
    action_type: "create_booking",
    description: `Booked ${body.guest_name} into Room ${room_number} (server-verified total ₹${billing.total.toFixed(0)}, ${nights} night${nights === 1 ? "" : "s"}).`,
  });

  if (body.from_enquiry_id) {
    const { error: enquiryError } = await adminClient
      .from("enquiries")
      .update({ status: "confirmed" })
      .eq("id", body.from_enquiry_id);

    if (enquiryError) {
      console.error(
        `[verify-reservation] reservation ${inserted.id} saved, but failed to mark enquiry ${body.from_enquiry_id} as confirmed:`,
        enquiryError.message,
      );
    }
  }

  return jsonResponse({
    data: {
      reservation: inserted,
      billing,
      nights,
    },
    error: null,
  });
}

async function handleUpdate(
  adminClient: SupabaseClient,
  callerId: string,
  body: VerifyReservationRequest,
): Promise<Response> {
  const { reservation_id } = body;
  if (!reservation_id) {
    return errorResponse("bad_request", "reservation_id is required.", 400);
  }

  const { data: existing, error: fetchError } = await adminClient
    .from("reservations")
    .select("*")
    .eq("id", reservation_id)
    .maybeSingle();

  if (fetchError) {
    return errorResponse("db_error", fetchError.message, 500);
  }
  if (!existing) {
    return errorResponse("not_found", "Reservation not found.", 404);
  }

  const roomNumber = existing.room_number as string | null;
  if (!roomNumber) {
    return errorResponse(
      "bad_request",
      "This reservation has no assigned room and cannot be re-verified.",
      400,
    );
  }

  const nights = countNights(existing.check_in_date, existing.check_out_date);
  if (nights <= 0) {
    return errorResponse("bad_request", "Reservation has an invalid date range.", 400);
  }

  const { nightlyRate, error: rateError } = await loadAuthoritativeRate(adminClient, roomNumber);
  if (rateError || nightlyRate === null) {
    return errorResponse("not_found", rateError ?? "Could not resolve room rate.", 404);
  }

  const { taxRatePercent, error: taxError } = await loadTaxRate(adminClient);
  if (taxError || taxRatePercent === null) {
    return errorResponse("db_error", taxError ?? "Could not resolve tax rate.", 500);
  }

  const discountAmount = Math.max(body.discount_amount ?? existing.discount_amount ?? 0, 0);
  const subtotal = nightlyRate * nights;

  if (discountAmount > subtotal) {
    return errorResponse("bad_request", "Discount must be between 0 and the subtotal.", 400);
  }

  const billing = computeBilling(subtotal, discountAmount, taxRatePercent);

  const amountPaid = resolveAmountPaid(
    billing,
    body.payment_status_override,
    body.amount_received ?? existing.amount_paid ?? 0,
  );
  const reconciledStatus = reconcilePaymentStatus(amountPaid, billing.total);

  logVerification("update", roomNumber, billing, body.client_total_amount, body.client_tax_amount);

  const { data: updated, error: updateError } = await adminClient
    .from("reservations")
    .update({
      discount_amount: discountAmount,
      tax_amount: billing.taxAmount,
      total_amount: billing.total,
      payment_status: reconciledStatus,
      amount_paid: amountPaid,
      internal_notes: body.internal_notes ?? existing.internal_notes,
    })
    .eq("id", reservation_id)
    .select()
    .single();

  if (updateError) {
    return errorResponse("db_error", updateError.message, 500);
  }

  await adminClient.from("audit_logs").insert({
    admin_id: callerId,
    action_type: "edit_ledger",
    description: `Edited booking for ${existing.guest_name ?? "guest"} (Room ${roomNumber}): server-verified total ₹${billing.total.toFixed(0)}, payment ${reconciledStatus}.`,
  });

  return jsonResponse({
    data: {
      reservation: updated,
      billing,
      nights,
    },
    error: null,
  });
}
