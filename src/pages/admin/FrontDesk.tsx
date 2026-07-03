import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LogIn, LogOut, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { todayIsoDate } from "../../lib/date";
import { loadPhysicalRooms, type PhysicalRoomWithCategory } from "../../lib/rooms";
import { useSystemContext } from "../../context/SystemContext";
import { WalkInBookingModal } from "./WalkInBookingModal";
import type { PendingEnquiry } from "../../lib/enquiries";
import type { Reservation } from "../../types/database";

export function FrontDesk() {
  const location = useLocation();
  const fromEnquiry = (location.state as { fromEnquiry?: PendingEnquiry } | null)
    ?.fromEnquiry;
  const { config } = useSystemContext();

  const [isModalOpen, setIsModalOpen] = useState(Boolean(fromEnquiry));
  const [rooms, setRooms] = useState<PhysicalRoomWithCategory[]>([]);

  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [departures, setDepartures] = useState<Reservation[]>([]);
  const [isLoadingPanels, setIsLoadingPanels] = useState(true);
  const [panelsError, setPanelsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRooms() {
      const result = await loadPhysicalRooms();
      setRooms(result.data);
    }

    loadRooms();
  }, []);

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Front Desk
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Log a confirmed WhatsApp or phone booking directly to the ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90"
        >
          <Plus size={16} />
          New Walk-In Booking
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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

      {isModalOpen && rooms.length > 0 && (
        <WalkInBookingModal
          rooms={rooms}
          taxRatePercent={config.tax_rate}
          fromEnquiry={fromEnquiry}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            loadDailyPanels();
          }}
        />
      )}
    </div>
  );
}
