import { useState } from "react";
import { AlertTriangle, ChevronDown, DatabaseBackup, ScrollText, Trash2, X } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

// Blueprint 4.7: restore sample demonstration data for training, and a full,
// deliberate wipe of the booking dataset for testing environments. Both RPCs
// enforce the master_admin check and (for the wipe) the confirmation phrase
// server-side — this panel's render gate and typed-phrase modal are UX, not
// the actual protection. See 0024_demo_data_and_wipe_functions.sql.

const WIPE_CONFIRMATION_PHRASE = "WIPE ALL RESERVATIONS";

// purge_audit_logs (0028, hardened in 0029) is a deliberate, explicit
// exception to this project's usual "the audit log is permanent and never
// purged" rule (Section 11.3) — a Master Admin can choose to hard-delete
// old audit rows for storage/retention reasons. It's gated identically to
// the wipe tool above: master_admin-only and confirmation-locked
// server-side, not just in this UI.
const PURGE_CONFIRMATION_PHRASE = "PURGE HISTORICAL LOGS";

const MONTHS_OLD_OPTIONS = [
  { value: "1", label: "1 Month Old" },
  { value: "3", label: "3 Months Old" },
  { value: "6", label: "6 Months Old" },
  { value: "12", label: "1 Year Old" },
] as const;

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

export function DangerZonePanel() {
  const { role } = useAuth();

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeConfirmationInput, setWipeConfirmationInput] = useState("");
  const [isWiping, setIsWiping] = useState(false);
  const [wipeMessage, setWipeMessage] = useState<string | null>(null);
  const [wipeError, setWipeError] = useState<string | null>(null);

  const [monthsOld, setMonthsOld] = useState("3");
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmationInput, setPurgeConfirmationInput] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  if (role !== "master_admin") {
    return (
      <div className="glass-panel flex items-center gap-3 rounded-xl p-6 text-sm text-white/60">
        <AlertTriangle size={18} className="shrink-0 text-amber-400" />
        Only the Master Administrator can access database controls.
      </div>
    );
  }

  async function handleRestoreDemoData() {
    if (!supabase) {
      setRestoreError("Database connection is not configured.");
      return;
    }

    setIsRestoring(true);
    setRestoreMessage(null);
    setRestoreError(null);

    const { data, error } = await supabase.rpc("restore_demo_reservations");

    setIsRestoring(false);

    if (error) {
      console.error("Failed to restore demo data:", error.message);
      setRestoreError("Could not restore demo data. Please try again.");
      return;
    }

    setRestoreMessage(
      `Restored ${data} demo reservation${data === 1 ? "" : "s"}. Each is marked "Demo —" in the guest name.`,
    );
  }

  async function handleWipe() {
    if (!supabase) {
      setWipeError("Database connection is not configured.");
      return;
    }

    setIsWiping(true);
    setWipeError(null);

    const { data, error } = await supabase.rpc("wipe_reservations_for_testing", {
      confirmation: wipeConfirmationInput,
    });

    setIsWiping(false);

    if (error) {
      console.error("Failed to wipe reservations:", error.message);
      setWipeError("The wipe was rejected by the server. Nothing was deleted.");
      return;
    }

    setIsWipeModalOpen(false);
    setWipeConfirmationInput("");
    setWipeMessage(
      `Wipe complete: ${data} reservation${data === 1 ? "" : "s"} and all enquiries permanently deleted. An audit entry was recorded.`,
    );
  }

  function closeWipeModal() {
    setIsWipeModalOpen(false);
    setWipeConfirmationInput("");
    setWipeError(null);
  }

  async function handlePurgeLogs() {
    if (!supabase) {
      setPurgeError("Database connection is not configured.");
      return;
    }

    setIsPurging(true);
    setPurgeError(null);

    const { error } = await supabase.rpc("purge_audit_logs", {
      months_old: Number(monthsOld),
      typed_confirmation: purgeConfirmationInput,
    });

    setIsPurging(false);

    if (error) {
      console.error("Failed to purge audit logs:", error.message);
      setPurgeError("The purge was rejected by the server. Nothing was deleted.");
      return;
    }

    setIsPurgeModalOpen(false);
    setPurgeConfirmationInput("");
    setPurgeMessage(
      `Purge complete: audit log rows older than ${
        MONTHS_OLD_OPTIONS.find((option) => option.value === monthsOld)?.label.toLowerCase() ?? "the selected threshold"
      } were permanently deleted. A footprint entry was recorded.`,
    );
  }

  function closePurgeModal() {
    setIsPurgeModalOpen(false);
    setPurgeConfirmationInput("");
    setPurgeError(null);
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-6 sm:p-8">
        <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-white">
          <DatabaseBackup size={20} className="text-primary" />
          Restore Demo Data
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Inserts six sample bookings against the property's real rooms, with
          dates spread around today, for training new staff on the dashboard,
          room map, and ledger. Demo bookings are clearly marked and are
          removed by the wipe tool below.
        </p>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            disabled={isRestoring}
            onClick={handleRestoreDemoData}
            className="rounded-sm bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRestoring ? "Restoring…" : "Restore Demo Data"}
          </button>
        </div>

        {restoreMessage && (
          <p className="mt-4 text-sm text-emerald-400" role="status">
            {restoreMessage}
          </p>
        )}
        {restoreError && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {restoreError}
          </p>
        )}
      </div>

      <div className="glass-panel rounded-xl border border-red-400/20 p-6 sm:p-8">
        <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-red-300">
          <Trash2 size={20} />
          Wipe All Bookings
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Permanently deletes every reservation and enquiry in a single atomic
          operation. Intended for testing environments only — this cannot be
          undone, and archived/cancelled bookings are deleted too. The audit
          log is never touched and will record that a wipe occurred.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => setIsWipeModalOpen(true)}
            className="rounded-sm border border-red-400/40 bg-red-400/10 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-red-300 transition-colors duration-300 hover:bg-red-400/20"
          >
            Wipe All Bookings…
          </button>
        </div>

        {wipeMessage && (
          <p className="mt-4 text-sm text-emerald-400" role="status">
            {wipeMessage}
          </p>
        )}
      </div>

      <div className="glass-panel rounded-xl border border-red-400/20 p-6 sm:p-8">
        <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-red-300">
          <ScrollText size={20} />
          Delete Old Activity Logs
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Clears out old activity history to save database space. Recent
          logs (like today's or this month's logs) will not be deleted to
          keep your current tracking safe.
        </p>

        <div className="mt-5 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="monthsOld" className="mb-1.5 block text-xs tracking-wide text-white/50">
              Purge Threshold
            </label>
            <div className="relative">
              <select
                id="monthsOld"
                value={monthsOld}
                onChange={(e) => setMonthsOld(e.target.value)}
                className={`${inputClasses} w-48 appearance-none pr-9`}
              >
                {MONTHS_OLD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-background-dark">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPurgeModalOpen(true)}
            className="rounded-sm border border-red-400/40 bg-red-400/10 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-red-300 transition-colors duration-300 hover:bg-red-400/20"
          >
            Purge Old Logs
          </button>
        </div>

        {purgeMessage && (
          <p className="mt-4 text-sm text-emerald-400" role="status">
            {purgeMessage}
          </p>
        )}
      </div>

      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-md rounded-xl border border-red-400/25 p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-xl font-semibold text-red-300">
                Confirm Full Wipe
              </h2>
              <button
                type="button"
                onClick={closeWipeModal}
                aria-label="Close"
                className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/80"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm text-white/70">
              Every reservation and enquiry will be permanently deleted. This
              cannot be undone. To proceed, type{" "}
              <span className="font-mono font-semibold text-red-300">
                {WIPE_CONFIRMATION_PHRASE}
              </span>{" "}
              below.
            </p>

            <input
              type="text"
              value={wipeConfirmationInput}
              onChange={(e) => setWipeConfirmationInput(e.target.value)}
              placeholder={WIPE_CONFIRMATION_PHRASE}
              className={`${inputClasses} mt-4 font-mono`}
            />

            {wipeError && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {wipeError}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeWipeModal}
                className="rounded-sm border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isWiping || wipeConfirmationInput !== WIPE_CONFIRMATION_PHRASE}
                onClick={handleWipe}
                className="rounded-sm bg-red-500/80 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isWiping ? "Wiping…" : "Wipe Everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-md rounded-xl border border-red-400/25 p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-xl font-semibold text-red-300">
                Confirm Audit Log Purge
              </h2>
              <button
                type="button"
                onClick={closePurgeModal}
                aria-label="Close"
                className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/80"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm text-white/70">
              Warning: This action will permanently delete all historical
              audit log rows older than the selected threshold. This action
              is irreversible.
            </p>

            <p className="mt-3 text-sm text-white/70">
              To proceed, type{" "}
              <span className="font-mono font-semibold text-red-300">
                {PURGE_CONFIRMATION_PHRASE}
              </span>{" "}
              below.
            </p>

            <input
              type="text"
              value={purgeConfirmationInput}
              onChange={(e) => setPurgeConfirmationInput(e.target.value)}
              placeholder={PURGE_CONFIRMATION_PHRASE}
              className={`${inputClasses} mt-4 font-mono`}
            />

            {purgeError && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {purgeError}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closePurgeModal}
                className="rounded-sm border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging || purgeConfirmationInput !== PURGE_CONFIRMATION_PHRASE}
                onClick={handlePurgeLogs}
                className="rounded-sm bg-red-500/80 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPurging ? "Purging…" : "Purge Old Logs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
