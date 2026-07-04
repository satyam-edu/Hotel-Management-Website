import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { daysInMonth, toIsoDate, todayIsoDate } from "../../lib/date";
import { loadPhysicalRooms, type PhysicalRoomWithCategory } from "../../lib/rooms";
import type { Reservation } from "../../types/database";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

export function AvailabilityCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());

  const [rooms, setRooms] = useState<PhysicalRoomWithCategory[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const totalDays = daysInMonth(year, monthIndex);
  const monthStart = toIsoDate(year, monthIndex, 1);
  const monthEnd = toIsoDate(year, monthIndex, totalDays);
  const todayIso = todayIsoDate();

  const loadCalendarData = useCallback(async () => {
    if (!supabase) {
      setLoadError("Database connection is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    const [roomsResult, reservationsResult] = await Promise.all([
      loadPhysicalRooms(),
      supabase
        .from("reservations")
        .select("*")
        .in("status", ["Checked-In", "Confirmed"])
        .lte("check_in_date", monthEnd)
        .gte("check_out_date", monthStart),
    ]);

    if (roomsResult.error || reservationsResult.error) {
      console.error(
        "Failed to load availability calendar data:",
        roomsResult.error ?? reservationsResult.error?.message,
      );
      setLoadError("Could not load the availability calendar. Please refresh.");
      setIsLoading(false);
      return;
    }

    setRooms(roomsResult.data);
    setReservations(reservationsResult.data ?? []);
    setIsLoading(false);
  }, [monthEnd, monthStart]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("availability_calendar_reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          loadCalendarData();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [loadCalendarData]);

  const floors = useMemo(() => groupByFloor(rooms), [rooms]);
  const sortedFloorNumbers = useMemo(
    () => Array.from(floors.keys()).sort((a, b) => a - b),
    [floors],
  );

  const dayNumbers = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays],
  );

  const reservationsByRoom = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const reservation of reservations) {
      if (!reservation.room_number) continue;
      const existing = map.get(reservation.room_number) ?? [];
      existing.push(reservation);
      map.set(reservation.room_number, existing);
    }
    return map;
  }, [reservations]);

  function reservationForCell(
    roomNumber: string,
    day: number,
  ): Reservation | null {
    const dateIso = toIsoDate(year, monthIndex, day);
    const roomReservations = reservationsByRoom.get(roomNumber) ?? [];
    return (
      roomReservations.find(
        (r) => r.check_in_date <= dateIso && dateIso < r.check_out_date,
      ) ?? null
    );
  }

  function goToPreviousMonth() {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((y) => y - 1);
    } else {
      setMonthIndex((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((y) => y + 1);
    } else {
      setMonthIndex((m) => m + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Availability Calendar
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Booking distribution for every room across the whole month.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="rounded-sm border border-white/15 p-2 text-white/60 transition-colors duration-300 hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium uppercase tracking-wider text-white/80">
            {MONTH_NAMES[monthIndex]} {year}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Next month"
            className="rounded-sm border border-white/15 p-2 text-white/60 transition-colors duration-300 hover:bg-white/5 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="glass-panel flex items-center justify-center gap-3 rounded-xl p-10 text-sm text-white/40">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
          Loading availability calendar…
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

      {!isLoading && !loadError && (
        <div className="glass-panel overflow-x-auto rounded-xl">
          <table className="border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b border-r border-white/10 bg-background-dark px-4 py-3 font-medium uppercase tracking-wider text-white/40">
                  Room
                </th>
                {dayNumbers.map((day) => {
                  const dateIso = toIsoDate(year, monthIndex, day);
                  const isToday = dateIso === todayIso;
                  return (
                    <th
                      key={day}
                      className={`border-b border-white/10 px-2 py-3 text-center font-medium ${
                        isToday ? "bg-primary/10 text-primary" : "text-white/40"
                      }`}
                    >
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedFloorNumbers.map((floorNumber) => (
                <Fragment key={floorNumber}>
                  <tr>
                    <td
                      colSpan={totalDays + 1}
                      className="border-b border-white/5 bg-white/[0.02] px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-primary"
                    >
                      Floor {floorNumber}
                    </td>
                  </tr>
                  {floors.get(floorNumber)?.map((room) => (
                    <tr key={room.room_number} className="border-b border-white/5">
                      <td className="sticky left-0 z-10 whitespace-nowrap border-r border-white/10 bg-background-dark px-4 py-2 font-medium text-white/80">
                        {room.room_number}
                      </td>
                      {dayNumbers.map((day) => {
                        const reservation = reservationForCell(
                          room.room_number,
                          day,
                        );
                        return (
                          <td
                            key={day}
                            className="border-l border-white/5 p-0 text-center"
                          >
                            {reservation ? (
                              <div
                                title={`${reservation.guest_name ?? "Guest"} · ${reservation.check_in_date} — ${reservation.check_out_date}`}
                                className={`flex h-8 min-w-[2.25rem] items-center justify-center truncate px-1 text-[10px] font-medium ${
                                  reservation.status === "Checked-In"
                                    ? "bg-indigo-400/25 text-indigo-200"
                                    : "bg-amber-400/25 text-amber-200"
                                }`}
                              >
                                {reservation.guest_name ?? "—"}
                              </div>
                            ) : (
                              <div className="h-8 min-w-[2.25rem]" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}

              {sortedFloorNumbers.length === 0 && (
                <tr>
                  <td
                    colSpan={totalDays + 1}
                    className="px-6 py-10 text-center text-sm text-white/40"
                  >
                    No physical rooms configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-indigo-400/25" />
          Checked-In
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-400/25" />
          Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-white/10" />
          Vacant
        </span>
      </div>
    </div>
  );
}
