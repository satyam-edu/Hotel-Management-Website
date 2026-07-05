import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatRoleLabel } from "../../context/AuthContext";
import {
  loadAuditLogs,
  AUDIT_LOG_PAGE_SIZE,
  type AuditLogWithActor,
} from "../../lib/auditLogs";
import type { AuditActionType } from "../../types/database";

const ACTION_TYPE_LABELS: Record<AuditActionType, string> = {
  create_booking: "Create Booking",
  edit_ledger: "Edit Ledger",
  check_in: "Check In",
  check_out: "Check Out",
  cancel_booking: "Cancel Booking",
  restore_booking: "Restore Booking",
  update_rates: "Update Rates",
  update_availability: "Update Availability",
  create_staff: "Create Staff",
  revoke_staff: "Revoke Staff",
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SettingsAudit() {
  const { role } = useAuth();
  const canView = role === "master_admin" || role === "head_admin";

  const [logs, setLogs] = useState<AuditLogWithActor[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;

    let isCancelled = false;
    setIsLoading(true);

    loadAuditLogs(page).then((result) => {
      if (isCancelled) return;
      setLogs(result.data);
      setTotalCount(result.totalCount);
      setLoadError(result.error);
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [page, canView]);

  if (!canView) {
    return (
      <div className="glass-panel flex items-center gap-3 rounded-xl p-6 text-sm text-white/60">
        <ShieldAlert size={18} className="shrink-0 text-amber-400" />
        You do not have permission to view the audit log.
      </div>
    );
  }

  const totalPages = Math.max(Math.ceil(totalCount / AUDIT_LOG_PAGE_SIZE), 1);

  return (
    <div className="glass-panel rounded-xl p-6 sm:p-8">
      <h2 className="font-display text-xl font-semibold text-white">
        System Audit Log
      </h2>
      <p className="mt-1 text-sm text-white/60">
        A permanent, append-only record of every administrative action.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="py-3 pr-4 font-medium">Timestamp</th>
              <th className="py-3 pr-4 font-medium">Administrator</th>
              <th className="py-3 pr-4 font-medium">Action Type</th>
              <th className="py-3 pr-4 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="py-8">
                  <div className="flex items-center justify-center gap-3 text-sm text-white/40">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
                    Loading audit log…
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && loadError && (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-sm text-red-400"
                  role="alert"
                >
                  {loadError}
                </td>
              </tr>
            )}

            {!isLoading &&
              !loadError &&
              logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4 whitespace-nowrap text-white/60">
                    {formatTimestamp(log.created_at)}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-white/80">
                    {log.actor_username ?? "—"}
                    {log.actor_role && (
                      <span className="ml-1.5 text-xs text-white/40">
                        ({formatRoleLabel(log.actor_role)})
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {ACTION_TYPE_LABELS[log.action_type]}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white/70">{log.description}</td>
                </tr>
              ))}

            {!isLoading && !loadError && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-white/40">
                  No audit activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !loadError && totalCount > 0 && (
        <div className="mt-5 flex items-center justify-between text-xs text-white/50">
          <p>
            Page {page + 1} of {totalPages} &middot; {totalCount} total entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              className="flex items-center gap-1 rounded-sm border border-white/15 px-3 py-1.5 uppercase tracking-wider transition-colors duration-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="flex items-center gap-1 rounded-sm border border-white/15 px-3 py-1.5 uppercase tracking-wider transition-colors duration-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
