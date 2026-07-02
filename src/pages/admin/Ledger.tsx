import { useEffect, useMemo, useState } from "react";
import { Calendar, Search, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Reservation, ReservationStatus } from "../../types/database";

const STATUS_FILTERS: Array<"All" | ReservationStatus> = [
  "All",
  "Confirmed",
  "Checked-In",
  "Checked-Out",
  "Cancelled",
];

const STATUS_BADGE_STYLES: Record<ReservationStatus, string> = {
  Confirmed: "bg-blue-400/10 text-blue-300 border-blue-400/25",
  "Checked-In": "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  "Checked-Out": "bg-white/10 text-white/60 border-white/15",
  Cancelled: "bg-red-400/10 text-red-300 border-red-400/25",
};

function formatDateRange(checkIn: string, checkOut: string): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  return `${format(checkIn)} — ${format(checkOut)}`;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatBookingId(id: string): string {
  return `KIG-${id.slice(0, 8).toUpperCase()}`;
}

export function Ledger() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ReservationStatus>(
    "All",
  );

  useEffect(() => {
    let isMounted = true;

    async function loadReservations() {
      if (!supabase) {
        setLoadError("Database connection is not configured.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load reservations:", error.message);
        setLoadError("Could not load the ledger. Please refresh the page.");
        setIsLoading(false);
        return;
      }

      setReservations(data ?? []);
      setIsLoading(false);
    }

    loadReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesStatus =
        statusFilter === "All" || reservation.status === statusFilter;

      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === "" ||
        (reservation.guest_name?.toLowerCase().includes(term) ?? false) ||
        reservation.id.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [reservations, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Master Ledger
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Every reservation, searchable and filterable.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by guest name or booking ID…"
            className="w-full rounded-sm border border-white/10 bg-white/[0.06] py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "All" | ReservationStatus)
          }
          className="rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white outline-none transition-colors duration-300 focus:border-primary sm:w-56"
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status} className="bg-background-dark">
              {status === "All" ? "All Statuses" : status}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-panel overflow-x-auto rounded-xl">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="px-6 py-4 font-medium">Booking ID</th>
              <th className="px-6 py-4 font-medium">Guest Name</th>
              <th className="px-6 py-4 font-medium">Room</th>
              <th className="px-6 py-4 font-medium">Dates</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  <div className="flex items-center justify-center gap-3 text-sm text-white/40">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
                    Loading reservations…
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && loadError && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-red-400"
                  role="alert"
                >
                  {loadError}
                </td>
              </tr>
            )}

            {!isLoading &&
              !loadError &&
              filteredReservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-6 py-4 font-mono text-xs text-white/70">
                    {formatBookingId(reservation.id)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-white/90">
                      <User size={14} className="shrink-0 text-primary" />
                      {reservation.guest_name ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {reservation.room_number
                      ? `Room ${reservation.room_number}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-white/70">
                      <Calendar size={14} className="shrink-0 text-white/40" />
                      {formatDateRange(
                        reservation.check_in_date,
                        reservation.check_out_date,
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {formatCurrency(reservation.total_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[reservation.status]}`}
                    >
                      {reservation.status}
                    </span>
                  </td>
                </tr>
              ))}

            {!isLoading && !loadError && filteredReservations.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-white/40"
                >
                  No reservations match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
