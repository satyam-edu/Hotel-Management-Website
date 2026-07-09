import { supabase } from "./supabase";
import type { AuditActionType, AuditLog, StaffRoleType } from "../types/database";

export type AuditLogWithActor = AuditLog & {
  actor_username: string | null;
  actor_role: StaffRoleType | null;
};

export interface AuditLogFilters {
  search?: string;
  actionType?: AuditActionType | "all";
}

const PAGE_SIZE = 20;

export async function loadAuditLogs(
  page: number,
  filters: AuditLogFilters = {},
): Promise<{
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

  let query = supabase
    .from("audit_logs")
    .select("*, staff_roles(username, role)", { count: "exact" });

  const search = filters.search?.trim();
  if (search) {
    // Escape the LIKE wildcards so a literal "%" in a search doesn't match
    // everything.
    const escaped = search.replace(/[%_]/g, (ch) => `\\${ch}`);
    query = query.ilike("description", `%${escaped}%`);
  }

  if (filters.actionType && filters.actionType !== "all") {
    query = query.eq("action_type", filters.actionType);
  }

  const { data, error, count } = await query
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
      // Prefer the role snapshotted at insert time (accurate history even if
      // the account's role later changed); rows from before migration 0025
      // have null and fall back to the live-joined role.
      actor_role: log.actor_role ?? staff_roles?.role ?? null,
    };
  });

  return { data: logs, totalCount: count ?? 0, error: null };
}

export { PAGE_SIZE as AUDIT_LOG_PAGE_SIZE };
