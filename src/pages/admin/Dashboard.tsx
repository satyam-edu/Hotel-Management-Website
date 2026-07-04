import { useEffect, useMemo, useState } from "react";
import { BedDouble, LogIn, LogOut, Percent } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { todayIsoDate } from "../../lib/date";
import { loadPhysicalRooms } from "../../lib/rooms";
import { RoomRatesPanel } from "./RoomRatesPanel";
import type { Reservation } from "../../types/database";

type OccupancyHealth = "low" | "healthy" | "peak";

const OCCUPANCY_STYLES: Record<OccupancyHealth, string> = {
  low: "text-amber-400",
  healthy: "text-emerald-400",
  peak: "text-red-400",
};

function occupancyHealth(rate: number): OccupancyHealth {
  if (rate > 80) return "peak";
  if (rate >= 30) return "healthy";
  return "low";
}

export function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadDashboardData() {
    if (!supabase) {
      setLoadError("Database connection is not configured.");
      setIsLoading(false);
      return;
    }

    const today = todayIsoDate();

    const [reservationsResult, roomsResult] = await Promise.all([
      supabase
        .from("reservations")
        .select("*")
        .in("status", ["Checked-In", "Confirmed"])
        .lte("check_in_date", today)
        .gte("check_out_date", today),
      loadPhysicalRooms(),
    ]);

    if (reservationsResult.error || roomsResult.error) {
      console.error(
        "Failed to load dashboard reservations:",
        reservationsResult.error?.message ?? roomsResult.error,
      );
      setLoadError("Could not load today's statistics. Please refresh.");
      setIsLoading(false);
      return;
    }

    setReservations(reservationsResult.data ?? []);
    setTotalRooms(roomsResult.data.length);
    setIsLoading(false);
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("dashboard_reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          loadDashboardData();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const today = todayIsoDate();

    const occupiedRoomNumbers = new Set<string>();
    let arrivalsToday = 0;
    let departuresToday = 0;

    for (const reservation of reservations) {
      if (
        reservation.status === "Checked-In" &&
        reservation.room_number &&
        reservation.check_in_date <= today &&
        reservation.check_out_date > today
      ) {
        occupiedRoomNumbers.add(reservation.room_number);
      }

      if (reservation.check_in_date === today) {
        arrivalsToday += 1;
      }

      if (reservation.check_out_date === today) {
        departuresToday += 1;
      }
    }

    const occupancyRate =
      totalRooms > 0
        ? Math.round((occupiedRoomNumbers.size / totalRooms) * 100)
        : 0;

    const vacantRooms = Math.max(totalRooms - occupiedRoomNumbers.size, 0);

    return { occupancyRate, arrivalsToday, departuresToday, vacantRooms };
  }, [reservations, totalRooms]);

  const occupancyStyle = OCCUPANCY_STYLES[occupancyHealth(stats.occupancyRate)];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Occupancy, check-ins, and revenue at a glance.
        </p>
      </div>

      {loadError && (
        <div
          className="glass-panel rounded-xl p-6 text-sm text-red-400"
          role="alert"
        >
          {loadError}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-2 text-white/50">
            <Percent size={16} />
            <p className="text-xs uppercase tracking-widest">
              Occupancy Rate
            </p>
          </div>
          <p
            className={`font-display mt-4 text-3xl font-semibold ${
              isLoading || loadError ? "text-white" : occupancyStyle
            }`}
          >
            {isLoading || loadError ? "—" : `${stats.occupancyRate}%`}
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-2 text-white/50">
            <BedDouble size={16} className="text-primary" />
            <p className="text-xs uppercase tracking-widest">
              Vacant Rooms
            </p>
          </div>
          <p className="font-display mt-4 text-3xl font-semibold text-white">
            {isLoading || loadError ? "—" : stats.vacantRooms}
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-2 text-white/50">
            <LogIn size={16} className="text-emerald-400" />
            <p className="text-xs uppercase tracking-widest">
              Arrivals Today
            </p>
          </div>
          <p className="font-display mt-4 text-3xl font-semibold text-white">
            {isLoading || loadError ? "—" : stats.arrivalsToday}
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center gap-2 text-white/50">
            <LogOut size={16} className="text-amber-400" />
            <p className="text-xs uppercase tracking-widest">
              Departures Today
            </p>
          </div>
          <p className="font-display mt-4 text-3xl font-semibold text-white">
            {isLoading || loadError ? "—" : stats.departuresToday}
          </p>
        </div>
      </div>

      <RoomRatesPanel />
    </div>
  );
}
