import { useState, type FormEvent } from "react";
import { CheckCircle2, ClipboardList, ShieldAlert } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useSystemContext } from "../../../context/SystemContext";
import { logConfigDiff } from "../../../lib/auditDiff";
import { supabase } from "../../../lib/supabase";

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary disabled:opacity-50";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

interface FormState {
  minBookingAge: string;
  maxAdultsPerRoom: string;
  maxChildrenPerRoom: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
}

export function BookingRulesTab() {
  const { role, user } = useAuth();
  const { config, refresh } = useSystemContext();
  const canEdit = role === "master_admin" || role === "head_admin";

  const [form, setForm] = useState<FormState>({
    minBookingAge: String(config.min_booking_age),
    maxAdultsPerRoom: String(config.max_adults_per_room),
    maxChildrenPerRoom: String(config.max_children_per_room),
    checkInTime: config.check_in_time,
    checkOutTime: config.check_out_time,
    cancellationPolicy: config.cancellation_policy,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!canEdit) {
    return (
      <div className="glass-panel flex items-center gap-3 rounded-xl p-6 text-sm text-white/60">
        <ShieldAlert size={18} className="shrink-0 text-amber-400" />
        You do not have permission to edit booking rules.
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    const minBookingAge = Number(form.minBookingAge);
    const maxAdultsPerRoom = Number(form.maxAdultsPerRoom);
    const maxChildrenPerRoom = Number(form.maxChildrenPerRoom);

    if (
      Number.isNaN(minBookingAge) ||
      Number.isNaN(maxAdultsPerRoom) ||
      Number.isNaN(maxChildrenPerRoom) ||
      minBookingAge < 0 ||
      maxAdultsPerRoom < 1 ||
      maxChildrenPerRoom < 0
    ) {
      setSaveError("Please enter valid values for the numeric fields.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setShowSuccess(false);

    const previousValues = {
      min_booking_age: config.min_booking_age,
      max_adults_per_room: config.max_adults_per_room,
      max_children_per_room: config.max_children_per_room,
      check_in_time: config.check_in_time,
      check_out_time: config.check_out_time,
      cancellation_policy: config.cancellation_policy,
    };
    const nextValues = {
      min_booking_age: minBookingAge,
      max_adults_per_room: maxAdultsPerRoom,
      max_children_per_room: maxChildrenPerRoom,
      check_in_time: form.checkInTime,
      check_out_time: form.checkOutTime,
      cancellation_policy: form.cancellationPolicy,
    };

    const { error } = await supabase
      .from("system_configurations")
      .update(nextValues)
      .eq("id", 1);

    if (error) {
      console.error("Failed to save booking rules:", error.message);
      setSaveError("Could not save booking rules. Please try again.");
      setIsSaving(false);
      return;
    }

    if (user) {
      // "Shifted minimum booking age baseline from 18 to 21" — numerical
      // boundary limits get explicit before/after values; times are logged
      // the same way, and the free-text cancellation policy is logged as a
      // targeted area reference rather than dumping its full contents.
      await logConfigDiff(user.id, "update_booking_rules", previousValues, nextValues, {
        min_booking_age: {
          label: "minimum booking age baseline",
          kind: "number",
          verb: "Shifted",
        },
        max_adults_per_room: { label: "max adults per room", kind: "number" },
        max_children_per_room: { label: "max children per room", kind: "number" },
        check_in_time: { label: "check-in time", kind: "time" },
        check_out_time: { label: "check-out time", kind: "time" },
        cancellation_policy: { label: "Cancellation Policy", kind: "text" },
      });
    }

    await refresh();
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <ClipboardList size={20} className="text-primary" />
        <h2 className="font-display text-xl font-semibold text-white">
          Booking Rules
        </h2>
      </div>
      <p className="mt-2 text-sm text-white/60">
        These values govern the guest-facing booking form and every receipt's
        printed check-in/check-out times.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="minBookingAge" className={labelClasses}>
            Minimum Booking Age
          </label>
          <input
            id="minBookingAge"
            type="number"
            min={0}
            required
            disabled={isSaving}
            value={form.minBookingAge}
            onChange={(e) => setForm((f) => ({ ...f, minBookingAge: e.target.value }))}
            className={inputClasses}
          />
        </div>

        <div />

        <div>
          <label htmlFor="maxAdultsPerRoom" className={labelClasses}>
            Max Adults / Room
          </label>
          <input
            id="maxAdultsPerRoom"
            type="number"
            min={1}
            required
            disabled={isSaving}
            value={form.maxAdultsPerRoom}
            onChange={(e) => setForm((f) => ({ ...f, maxAdultsPerRoom: e.target.value }))}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="maxChildrenPerRoom" className={labelClasses}>
            Max Children / Room
          </label>
          <input
            id="maxChildrenPerRoom"
            type="number"
            min={0}
            required
            disabled={isSaving}
            value={form.maxChildrenPerRoom}
            onChange={(e) => setForm((f) => ({ ...f, maxChildrenPerRoom: e.target.value }))}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="checkInTime" className={labelClasses}>
            Check-In Time
          </label>
          <input
            id="checkInTime"
            type="time"
            required
            disabled={isSaving}
            value={form.checkInTime}
            onChange={(e) => setForm((f) => ({ ...f, checkInTime: e.target.value }))}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="checkOutTime" className={labelClasses}>
            Check-Out Time
          </label>
          <input
            id="checkOutTime"
            type="time"
            required
            disabled={isSaving}
            value={form.checkOutTime}
            onChange={(e) => setForm((f) => ({ ...f, checkOutTime: e.target.value }))}
            className={inputClasses}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="cancellationPolicy" className={labelClasses}>
            Cancellation Policy
          </label>
          <textarea
            id="cancellationPolicy"
            rows={4}
            disabled={isSaving}
            value={form.cancellationPolicy}
            onChange={(e) => setForm((f) => ({ ...f, cancellationPolicy: e.target.value }))}
            className={`${inputClasses} resize-none`}
          />
        </div>
      </div>

      {saveError && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {saveError}
        </p>
      )}

      <div className="mt-7 flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-sm bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save Booking Rules"}
        </button>

        {showSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 size={16} />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
