import { useEffect, useMemo, useState } from "react";
import { PHYSICAL_ROOMS, type PhysicalRoomEntry } from "../../data/inventory";
import { supabase } from "../../lib/supabase";
import { todayIsoDate } from "../../lib/date";
import type { Reservation } from "../../types/database";

type RoomStatus = "Available" | "Occupied";

const STATUS_STYLES: Record<RoomStatus, { dot: string; text: string }> = {
  Available: { dot: "bg-emerald-400", text: "text-emerald-400" },
  Occupied: { dot: "bg-red-400", text: "text-red-400" },
};

function floorFor(roomNumber: string): number {
  return Math.floor(Number(roomNumber) / 100);
}

function groupByFloor(
  rooms: PhysicalRoomEntry[],
): Map<number, PhysicalRoomEntry[]> {
  const floors = new Map<number, PhysicalRoomEntry[]>();

  for (const room of rooms) {
    const floor = floorFor(room.room_number);
    const existing = floors.get(floor) ?? [];
    existing.push(room);
    floors.set(floor, existing);
  }

  for (const rooms of floors.values()) {
    rooms.sort((a, b) => a.room_number.localeCompare(b.room_number));
  }

  return floors;
}

export function RoomMap() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const floors = useMemo(() => groupByFloor(PHYSICAL_ROOMS), []);
  const sortedFloorNumbers = useMemo(
    () => Array.from(floors.keys()).sort((a, b) => a - b),
    [floors],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadActiveReservations() {
      if (!supabase) {
        setLoadError("Database connection is not configured.");
        setIsLoading(false);
        return;
      }

      const today = todayIsoDate();

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .in("status", ["Checked-In", "Confirmed"])
        .lte("check_in_date", today)
        .gte("check_out_date", today);

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load active reservations:", error.message);
        setLoadError("Could not load live room status. Please refresh.");
        setIsLoading(false);
        return;
      }

      setReservations(data ?? []);
      setIsLoading(false);
    }

    loadActiveReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  const occupiedRoomNumbers = useMemo(() => {
    const today = todayIsoDate();
    const occupied = new Set<string>();

    for (const reservation of reservations) {
      if (!reservation.room_number || reservation.status !== "Checked-In") {
        continue;
      }

      // Compare calendar days only — check_in_date/check_out_date are plain
      // YYYY-MM-DD strings with no time component, so string comparison is
      // safe and avoids any timezone-related off-by-one.
      const isWithinStay =
        reservation.check_in_date <= today && today <= reservation.check_out_date;

      if (isWithinStay) {
        occupied.add(reservation.room_number);
      }
    }

    return occupied;
  }, [reservations]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Live Room Map
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Visual floor-by-floor grid of every physical room.
        </p>
      </div>

      {isLoading && (
        <div className="glass-panel flex items-center justify-center gap-3 rounded-xl p-10 text-sm text-white/40">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
          Loading live room status…
        </div>
      )}

      {!isLoading && loadError && (
        <div
          className="glass-panel rounded-xl p-10 text-center text-sm text-red-400"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {!isLoading &&
        !loadError &&
        sortedFloorNumbers.map((floorNumber) => (
          <section key={floorNumber}>
            <h2 className="text-xs uppercase tracking-[0.3em] text-primary">
              Floor {floorNumber}
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {floors.get(floorNumber)?.map((room) => {
                const status: RoomStatus = occupiedRoomNumbers.has(
                  room.room_number,
                )
                  ? "Occupied"
                  : "Available";
                const styles = STATUS_STYLES[status];

                return (
                  <div
                    key={room.room_number}
                    className="glass-panel rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-display text-2xl font-semibold text-white">
                        {room.room_number}
                      </p>
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`}
                        aria-hidden="true"
                      />
                    </div>

                    <p className="mt-1 text-sm text-white/60">
                      {room.category_name}
                    </p>

                    <p
                      className={`mt-3 text-xs font-semibold uppercase tracking-wider ${styles.text}`}
                    >
                      {status}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
