import { supabase } from "./supabase";
import type { AuditLog, StaffRoleType } from "../types/database";

export type AuditLogWithActor = AuditLog & {
  actor_username: string | null;
  actor_role: StaffRoleType | null;
};

const PAGE_SIZE = 20;

export async function loadAuditLogs(page: number): Promise<{
  data: AuditLogWithActor[];
  totalCount: number;
  error: string | null;
}> {
  if (!supabase) {
    return {
      data: [],
      totalCount: 0,
      error: "Database connection is not configured.",
    };
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("audit_logs")
    .select("*, staff_roles(username, role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Failed to load audit logs:", error.message);
    return { data: [], totalCount: 0, error: "Could not load the audit log." };
  }

  const logs = (data ?? []).map((row) => {
    const { staff_roles, ...log } = row as AuditLog & {
      staff_roles: { username: string; role: StaffRoleType } | null;
    };
    return {
      ...log,
      actor_username: staff_roles?.username ?? null,
      actor_role: staff_roles?.role ?? null,
    };
  });

  return { data: logs, totalCount: count ?? 0, error: null };
}

export { PAGE_SIZE as AUDIT_LOG_PAGE_SIZE };
