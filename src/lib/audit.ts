import { supabase } from "./supabase";
import type { AuditActionType } from "../types/database";

export interface AuditValueSnapshot {
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

// actor_role is snapshotted by the column's current_staff_role() default at
// insert time (0025_audit_logs_structured_values.sql), so callers here never
// pass it — only the edge functions, which insert under the service role
// where that default resolves to null, set it explicitly.
export async function logAction(
  adminId: string,
  actionType: AuditActionType,
  description: string,
  values?: AuditValueSnapshot,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action_type: actionType,
    description,
    old_value: values?.oldValue ?? null,
    new_value: values?.newValue ?? null,
  });

  if (error) {
    console.error("Failed to write audit log:", error.message);
  }
}
