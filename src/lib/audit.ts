import { supabase } from "./supabase";
import type { AuditActionType } from "../types/database";

export async function logAction(
  adminId: string,
  actionType: AuditActionType,
  description: string,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action_type: actionType,
    description,
  });

  if (error) {
    console.error("Failed to write audit log:", error.message);
  }
}
