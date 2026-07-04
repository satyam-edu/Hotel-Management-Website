import { useEffect, useMemo, useState } from "react";
import { Calendar, Phone, User, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { todayIsoDate } from "../../lib/date";
import { loadPhysicalRooms, type PhysicalRoomWithCategory } from "../../lib/rooms";
import { useSystemContext } from "../../context/SystemContext";
import { WalkInBookingModal } from "./WalkInBookingModal";
import type { Reservation } from "../../types/database";

type RoomStatus = "Vacant" | "Occupied" | "Awaiting Arrival";

const STATUS_STYLES: Record<
  RoomStatus,
  { card: string; dot: string; text: string }
> = {
  Vacant: {
    card: "border-emerald-400/20 bg-emerald-400/[0.03] hover:border-emerald-400/40",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  Occupied: {
    card: "border-indigo-400/25 bg-indigo-400/[0.06]",
    dot: "bg-indigo-400",
    text: "text-indigo-300",
  },
  "Awaiting Arrival": {
    card: "border-amber-400/25 bg-amber-400/[0.06]",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
};

function groupByFloor(
  rooms: PhysicalRoomWithCategory[],
): Map<number, PhysicalRoomWithCategory[]> {
  const floors = new Map<number, PhysicalRoomWithCategory[]>();

  for (const room of rooms) {
    const existing = floors.get(room.floor) ?? [];
    existing.push(room);
    floors.set(room.floor, existing);
  }

  for (const rooms of floors.values()) {
    rooms.sort((a, b) => a.room_number.localeCompare(b.room_number));
  }

  return floors;
}

function formatDateRange(checkIn: string, checkOut: string): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  return `${format(checkIn)} — ${format(checkOut)}`;
}

export function RoomMap() {
  const { config } = useSystemContext();

  const [rooms, setRooms] = useState<PhysicalRoomWithCategory[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [bookingRoomNumber, setBookingRoomNumber] = useState<string | null>(null);
  const [popoverReservation, setPopoverReservation] = useState<Reservation | null>(
    null,
  );

  const floors = useMemo(() => groupByFloor(rooms), [rooms]);
  const sortedFloorNumbers = useMemo(
    () => Array.from(floors.keys()).sort((a, b) => a - b),
    [floors],
  );

  async function loadRoomMapData() {
    if (!supabase) {
      setLoadError("Database connection is not configured.");
      setIsLoading(false);
      return;
    }

    const today = todayIsoDate();

    const [roomsResult, reservationsResult] = await Promise.all([
      loadPhysicalRooms(),
      supabase
        .from("reservations")
        .select("*")
        .in("status", ["Checked-In", "Confirmed"])
        .lte("check_in_date", today)
        .gte("check_out_date", today),
    ]);

    if (roomsResult.error || reservationsResult.error) {
      console.error(
        "Failed to load room map data:",
        roomsResult.error ?? reservationsResult.error?.message,
      );
      setLoadError("Could not load live room status. Please refresh.");
      setIsLoading(false);
      return;
    }

    setRooms(roomsResult.data);
    setReservations(reservationsResult.data ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadRoomMapData();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("room_map_reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          loadRoomMapData();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const reservationByRoom = useMemo(() => {
    const today = todayIsoDate();
    const map = new Map<string, { status: RoomStatus; reservation: Reservation }>();

    for (const reservation of reservations) {
      if (!reservation.room_number) continue;

      const isWithinStay =
        reservation.check_in_date <= today && today <= reservation.check_out_date;
      if (!isWithinStay) continue;

      if (reservation.status === "Checked-In") {
        map.set(reservation.room_number, { status: "Occupied", reservation });
      } else if (
        reservation.status === "Confirmed" &&
        reservation.check_in_date === today
      ) {
        map.set(reservation.room_number, {
          status: "Awaiting Arrival",
          reservation,
        });
      }
    }

    return map;
  }, [reservations]);

  function handleRoomClick(room: PhysicalRoomWithCategory) {
    const entry = reservationByRoom.get(room.room_number);
    if (!entry) {
      setBookingRoomNumber(room.room_number);
    } else {
      setPopoverReservation((current) =>
        current?.id === entry.reservation.id ? null : entry.reservation,
      );
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Live Room Map
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Visual floor-by-floor grid of every physical room. Click a vacant
          room to start a walk-in booking.
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
                const entry = reservationByRoom.get(room.room_number);
                const status: RoomStatus = entry?.status ?? "Vacant";
                const styles = STATUS_STYLES[status];

                return (
                  <button
                    key={room.room_number}
                    type="button"
                    onClick={() => handleRoomClick(room)}
                    className={`glass-panel rounded-xl border p-5 text-left transition-colors duration-300 ${styles.card}`}
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
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      {popoverReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-sm rounded-xl p-6">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-semibold text-white">
                Room {popoverReservation.room_number}
              </h3>
              <button
                type="button"
                onClick={() => setPopoverReservation(null)}
                aria-label="Close"
                className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/80"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-white/90">
                <User size={14} className="shrink-0 text-primary" />
                {popoverReservation.guest_name ?? "—"}
              </p>
              <p className="flex items-center gap-2 text-white/70">
                <Phone size={14} className="shrink-0 text-white/40" />
                {popoverReservation.guest_phone ?? "—"}
              </p>
              <p className="flex items-center gap-2 text-white/70">
                <Calendar size={14} className="shrink-0 text-white/40" />
                {formatDateRange(
                  popoverReservation.check_in_date,
                  popoverReservation.check_out_date,
                )}
              </p>
            </div>

            <a
              href="/admin/ledger"
              className="mt-6 block rounded-sm bg-primary py-2.5 text-center text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90"
            >
              View in Master Ledger
            </a>
          </div>
        </div>
      )}

      {bookingRoomNumber && rooms.length > 0 && (
        <WalkInBookingModal
          rooms={rooms}
          taxRatePercent={config.tax_rate}
          initialRoomNumber={bookingRoomNumber}
          onClose={() => setBookingRoomNumber(null)}
          onSaved={() => {
            setBookingRoomNumber(null);
            loadRoomMapData();
          }}
        />
      )}
    </div>
  );
}
