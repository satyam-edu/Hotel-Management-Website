import { useEffect, useState, type FormEvent } from "react";
import {
  BedDouble,
  Calendar,
  CheckCircle2,
  IndianRupee,
  LogIn,
  LogOut,
  Phone,
  User,
} from "lucide-react";
import { PHYSICAL_ROOMS } from "../../data/inventory";
import { supabase } from "../../lib/supabase";
import { todayIsoDate } from "../../lib/date";
import type { Reservation } from "../../types/database";

interface BookingFormState {
  guestName: string;
  phone: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
}

const INITIAL_STATE: BookingFormState = {
  guestName: "",
  phone: "",
  roomNumber: PHYSICAL_ROOMS[0].room_number,
  checkIn: "",
  checkOut: "",
  totalAmount: "",
};

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 flex items-center gap-1.5 text-xs tracking-wide text-white/50";

export function FrontDesk() {
  const [form, setForm] = useState<BookingFormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [departures, setDepartures] = useState<Reservation[]>([]);
  const [isLoadingPanels, setIsLoadingPanels] = useState(true);
  const [panelsError, setPanelsError] = useState<string | null>(null);

  async function loadDailyPanels() {
    if (!supabase) {
      setPanelsError("Database connection is not configured.");
      setIsLoadingPanels(false);
      return;
    }

    const today = todayIsoDate();
    setIsLoadingPanels(true);
    setPanelsError(null);

    const [arrivalsResult, departuresResult] = await Promise.all([
      supabase
        .from("reservations")
        .select("*")
        .eq("check_in_date", today)
        .eq("status", "Confirmed"),
      supabase
        .from("reservations")
        .select("*")
        .eq("check_out_date", today)
        .eq("status", "Checked-In"),
    ]);

    if (arrivalsResult.error || departuresResult.error) {
      console.error(
        "Failed to load daily panels:",
        arrivalsResult.error?.message ?? departuresResult.error?.message,
      );
      setPanelsError("Could not load today's arrivals and departures.");
      setIsLoadingPanels(false);
      return;
    }

    setArrivals(arrivalsResult.data ?? []);
    setDepartures(departuresResult.data ?? []);
    setIsLoadingPanels(false);
  }

  useEffect(() => {
    loadDailyPanels();
  }, []);

  function updateField<K extends keyof BookingFormState>(
    field: K,
    value: BookingFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setSubmitError("Database connection is not configured.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const { error } = await supabase.from("reservations").insert({
      guest_name: form.guestName,
      guest_phone: form.phone,
      room_number: form.roomNumber,
      check_in_date: form.checkIn,
      check_out_date: form.checkOut,
      total_amount: Number(form.totalAmount),
      status: "Confirmed",
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Failed to create reservation:", error.message);
      setSubmitError("Could not save this booking. Please try again.");
      return;
    }

    setForm(INITIAL_STATE);
    setSubmitSuccess(true);
    await loadDailyPanels();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Front Desk
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Log a confirmed WhatsApp or phone booking directly to the ledger.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-xl p-6 sm:p-8"
        >
          <h2 className="font-display text-xl font-semibold text-white">
            New Booking
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="guestName" className={labelClasses}>
                <User size={14} />
                Guest Name
              </label>
              <input
                id="guestName"
                type="text"
                required
                value={form.guestName}
                onChange={(e) => updateField("guestName", e.target.value)}
                placeholder="Full name"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClasses}>
                <Phone size={14} />
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                pattern="[0-9]{10}"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="roomNumber" className={labelClasses}>
                <BedDouble size={14} />
                Room
              </label>
              <select
                id="roomNumber"
                value={form.roomNumber}
                onChange={(e) => updateField("roomNumber", e.target.value)}
                className={inputClasses}
              >
                {PHYSICAL_ROOMS.map((room) => (
                  <option
                    key={room.room_number}
                    value={room.room_number}
                    className="bg-background-dark"
                  >
                    {room.room_number} — {room.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="totalAmount" className={labelClasses}>
                <IndianRupee size={14} />
                Total Amount
              </label>
              <input
                id="totalAmount"
                type="number"
                min={0}
                required
                value={form.totalAmount}
                onChange={(e) => updateField("totalAmount", e.target.value)}
                placeholder="0"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="checkIn" className={labelClasses}>
                <Calendar size={14} />
                Check-in Date
              </label>
              <input
                id="checkIn"
                type="date"
                required
                value={form.checkIn}
                onChange={(e) => updateField("checkIn", e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="checkOut" className={labelClasses}>
                <Calendar size={14} />
                Check-out Date
              </label>
              <input
                id="checkOut"
                type="date"
                required
                min={form.checkIn || undefined}
                value={form.checkOut}
                onChange={(e) => updateField("checkOut", e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-sm bg-primary py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
            >
              {isSubmitting ? "Saving…" : "Confirm Booking"}
            </button>

            {submitSuccess && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 size={16} />
                Booking saved to the ledger.
              </p>
            )}

            {submitError && (
              <p className="text-sm text-red-400" role="alert">
                {submitError}
              </p>
            )}
          </div>
        </form>

        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <LogIn size={16} className="text-emerald-400" />
              Arrivals Today
            </h3>

            {isLoadingPanels && (
              <p className="mt-4 text-sm text-white/40">Loading…</p>
            )}

            {!isLoadingPanels && panelsError && (
              <p className="mt-4 text-sm text-red-400" role="alert">
                {panelsError}
              </p>
            )}

            {!isLoadingPanels && !panelsError && arrivals.length === 0 && (
              <p className="mt-4 text-sm text-white/40">
                No arrivals remaining today.
              </p>
            )}

            {!isLoadingPanels && !panelsError && arrivals.length > 0 && (
              <ul className="mt-4 space-y-3">
                {arrivals.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm text-white/80">
                      {reservation.guest_name ?? "—"}
                    </span>
                    <span className="text-xs text-white/40">
                      Room {reservation.room_number ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <LogOut size={16} className="text-amber-400" />
              Departures Today
            </h3>

            {isLoadingPanels && (
              <p className="mt-4 text-sm text-white/40">Loading…</p>
            )}

            {!isLoadingPanels && panelsError && (
              <p className="mt-4 text-sm text-red-400" role="alert">
                {panelsError}
              </p>
            )}

            {!isLoadingPanels && !panelsError && departures.length === 0 && (
              <p className="mt-4 text-sm text-white/40">
                No departures remaining today.
              </p>
            )}

            {!isLoadingPanels && !panelsError && departures.length > 0 && (
              <ul className="mt-4 space-y-3">
                {departures.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm text-white/80">
                      {reservation.guest_name ?? "—"}
                    </span>
                    <span className="text-xs text-white/40">
                      Room {reservation.room_number ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
