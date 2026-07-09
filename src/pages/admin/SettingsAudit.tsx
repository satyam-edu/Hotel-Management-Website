import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatRoleLabel } from "../../context/AuthContext";
import {
  loadAuditLogs,
  AUDIT_LOG_PAGE_SIZE,
  type AuditLogWithActor,
} from "../../lib/auditLogs";
import type { AuditActionType } from "../../types/database";

const SEARCH_DEBOUNCE_MS = 300;

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
  create_category: "Create Category",
  edit_category: "Edit Category",
  archive_category: "Archive Category",
  restore_category: "Restore Category",
  create_room: "Create Room",
  delete_room: "Delete Room",
  reassign_room_category: "Reassign Room",
  update_branding: "Update Branding",
  update_booking_rules: "Update Booking Rules",
  update_invoice_config: "Update Invoice Config",
  update_site_content: "Update Site Content",
  toggle_maintenance_mode: "Maintenance Mode Toggle",
  upload_asset: "Upload Asset",
  upload_gallery_image: "Upload Gallery Image",
  archive_gallery_image: "Archive Gallery Image",
  restore_gallery_image: "Restore Gallery Image",
  delete_gallery_image: "Delete Gallery Image",
  update_gallery_image_folder: "Reassign Gallery Folder",
  restore_demo_data: "Restore Demo Data",
  wipe_reservations: "Wipe Bookings",
  hard_delete_booking: "Permanently Delete Booking",
  update_staff_profile: "Update Staff Profile",
  delete_staff: "Delete Staff Account",
  system_purge: "Audit Log Purge",
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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState<AuditActionType | "all">("all");

  // Debounce keystrokes into the applied search term, resetting to the first
  // page whenever the term actually changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!canView) return;

    let isCancelled = false;
    setIsLoading(true);

    loadAuditLogs(page, { search, actionType: actionTypeFilter }).then((result) => {
      if (isCancelled) return;
      setLogs(result.data);
      setTotalCount(result.totalCount);
      setLoadError(result.error);
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [page, canView, search, actionTypeFilter]);

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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search descriptions…"
            aria-label="Search audit log descriptions"
            className="w-full rounded-sm border border-white/10 bg-white/[0.06] py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary"
          />
        </div>
        <div className="relative sm:w-56">
          <select
            value={actionTypeFilter}
            onChange={(e) => {
              setActionTypeFilter(e.target.value as AuditActionType | "all");
              setPage(0);
            }}
            aria-label="Filter by action type"
            className="w-full appearance-none rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 pr-9 text-sm text-white outline-none transition-colors duration-300 focus:border-primary"
          >
            <option value="all" className="bg-background-dark">
              All Action Types
            </option>
            {(Object.keys(ACTION_TYPE_LABELS) as AuditActionType[]).map((type) => (
              <option key={type} value={type} className="bg-background-dark">
                {ACTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
          />
        </div>
      </div>

      <div className="mt-6 w-full overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[780px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[48%]" />
          </colgroup>
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
                  {search || actionTypeFilter !== "all"
                    ? "No audit entries match the current filters."
                    : "No audit activity recorded yet."}
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
