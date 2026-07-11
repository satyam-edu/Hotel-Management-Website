import { supabase } from "./supabase";
import type { ChildDetail, PaymentStatus, Reservation } from "../types/database";
import type { BillingBreakdown } from "./billing";

interface VerificationError {
  code: string;
  message: string;
}

interface VerificationResult<T> {
  data: T | null;
  error: VerificationError | null;
}

interface VerifiedReservationPayload {
  reservation: Reservation;
  billing: BillingBreakdown;
  nights: number;
}

async function invokeVerifyReservation<T>(
  body: Record<string, unknown>,
): Promise<VerificationResult<T>> {
  if (!supabase) {
    return {
      data: null,
      error: { code: "not_configured", message: "Database connection is not configured." },
    };
  }

  const { data, error } = await supabase.functions.invoke("verify-reservation", { body });

  if (error) {
    const context = (error as { context?: { json?: () => Promise<VerificationResult<T>> } })
      .context;
    if (context?.json) {
      try {
        const parsed = await context.json();
        if (parsed?.error) return parsed;
      } catch {
        // fall through to the generic error below
      }
    }
    return {
      data: null,
      error: { code: "invoke_error", message: error.message },
    };
  }

  return data as VerificationResult<T>;
}

export interface CreateReservationPayload {
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  child_details: ChildDetail[];
  guest_name: string;
  guest_phone: string;
  discount_amount: number;
  amount_received: number;
  payment_status_override?: PaymentStatus;
  internal_notes: string;
  from_enquiry_id?: string;
  client_total_amount: number;
  client_tax_amount: number;
}

export async function createVerifiedReservation(payload: CreateReservationPayload): Promise<{
  data: VerifiedReservationPayload | null;
  errorCode: string | null;
  errorMessage: string | null;
}> {
  const result = await invokeVerifyReservation<VerifiedReservationPayload>({
    action: "create",
    ...payload,
  });

  if (result.error) {
    return { data: null, errorCode: result.error.code, errorMessage: result.error.message };
  }

  return { data: result.data, errorCode: null, errorMessage: null };
}

export interface UpdateReservationPayload {
  reservation_id: string;
  new_room_number?: string;
  discount_amount: number;
  amount_received: number;
  payment_status_override?: PaymentStatus;
  internal_notes: string;
  guest_gstin?: string;
  client_total_amount: number;
  client_tax_amount: number;
}

export async function updateVerifiedReservation(payload: UpdateReservationPayload): Promise<{
  data: VerifiedReservationPayload | null;
  errorCode: string | null;
  errorMessage: string | null;
}> {
  const result = await invokeVerifyReservation<VerifiedReservationPayload>({
    action: "update",
    ...payload,
  });

  if (result.error) {
    return { data: null, errorCode: result.error.code, errorMessage: result.error.message };
  }

  return { data: result.data, errorCode: null, errorMessage: null };
}
