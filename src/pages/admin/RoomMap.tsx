import { useMemo } from "react";
import { PHYSICAL_ROOMS, type PhysicalRoomEntry } from "../../data/inventory";

type RoomStatus = "Available" | "Occupied" | "Maintenance";

const STATUS_STYLES: Record<RoomStatus, { dot: string; text: string }> = {
  Available: { dot: "bg-emerald-400", text: "text-emerald-400" },
  Occupied: { dot: "bg-red-400", text: "text-red-400" },
  Maintenance: { dot: "bg-amber-400", text: "text-amber-400" },
};

const STATUS_ORDER: RoomStatus[] = ["Available", "Occupied", "Maintenance"];

function hashRoomNumber(roomNumber: string): number {
  let hash = 0;
  for (const char of roomNumber) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function mockStatusFor(roomNumber: string): RoomStatus {
  return STATUS_ORDER[hashRoomNumber(roomNumber) % STATUS_ORDER.length];
}

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
  const floors = useMemo(() => groupByFloor(PHYSICAL_ROOMS), []);
  const sortedFloorNumbers = useMemo(
    () => Array.from(floors.keys()).sort((a, b) => a - b),
    [floors],
  );

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

      {sortedFloorNumbers.map((floorNumber) => (
        <section key={floorNumber}>
          <h2 className="text-xs uppercase tracking-[0.3em] text-primary">
            Floor {floorNumber}
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {floors.get(floorNumber)?.map((room) => {
              const status = mockStatusFor(room.room_number);
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
