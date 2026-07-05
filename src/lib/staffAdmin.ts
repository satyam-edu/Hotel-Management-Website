import { supabase } from "./supabase";
import type { StaffRoleType } from "../types/database";

export interface StaffAccountWithEmail {
  id: string;
  username: string;
  email: string;
  role: StaffRoleType;
  created_at: string;
  deactivated_at: string | null;
}

interface StaffAdminError {
  code: string;
  message: string;
}

interface StaffAdminResult<T> {
  data: T | null;
  error: StaffAdminError | null;
}

async function invokeStaffAdmin<T>(
  body: Record<string, unknown>,
): Promise<StaffAdminResult<T>> {
  if (!supabase) {
    return {
      data: null,
      error: { code: "not_configured", message: "Database connection is not configured." },
    };
  }

  const { data, error } = await supabase.functions.invoke("staff-admin", { body });

  if (error) {
    const context = (error as { context?: { json?: () => Promise<StaffAdminResult<T>> } })
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

  return data as StaffAdminResult<T>;
}

export async function listStaff(): Promise<{
  data: StaffAccountWithEmail[];
  error: string | null;
}> {
  const result = await invokeStaffAdmin<StaffAccountWithEmail[]>({ action: "list" });

  if (result.error) {
    console.error("Failed to load staff list:", result.error.message);
    return { data: [], error: result.error.message };
  }

  return { data: result.data ?? [], error: null };
}

export async function createStaff(payload: {
  username: string;
  email: string;
  password: string;
  role: StaffRoleType;
}): Promise<{ data: { id: string } | null; errorCode: string | null; errorMessage: string | null }> {
  const result = await invokeStaffAdmin<{ id: string }>({ action: "create", ...payload });

  if (result.error) {
    return { data: null, errorCode: result.error.code, errorMessage: result.error.message };
  }

  return { data: result.data, errorCode: null, errorMessage: null };
}

export async function revokeStaff(
  id: string,
): Promise<{ success: boolean; errorMessage: string | null }> {
  const result = await invokeStaffAdmin<{ id: string }>({ action: "revoke", id });

  if (result.error) {
    return { success: false, errorMessage: result.error.message };
  }

  return { success: true, errorMessage: null };
}
