import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Phone,
  Rows3,
  User,
  X,
} from "lucide-react";
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

const MIN_DAY_COLUMN_WIDTH = 40;
const ROOM_COLUMN_WIDTH = 96;
const ROW_HEIGHT = 44;

const STATUS_STYLES: Record<string, { fill: string; text: string }> = {
  "Checked-In": {
    fill: "bg-indigo-500/10 hover:bg-indigo-500/15",
    text: "text-indigo-300",
  },
  Confirmed: {
    fill: "bg-amber-500/10 hover:bg-amber-500/15",
    text: "text-amber-300",
  },
};

type ViewMode = "timeline" | "density";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Blueprint 4.6: density cells escalate from calm toward urgent as the day
// fills up — a monotonic scale, distinct from the dashboard's business-health
// tri-state (where LOW occupancy is the warning). Every cell also carries the
// literal "booked/total" figure, so the density reads without color
// perception, per the design system's color-redundancy rule.
const DENSITY_STEPS = [
  { maxRatio: 0, cell: "bg-white/[0.02]", text: "text-white/40", label: "Empty" },
  { maxRatio: 0.4, cell: "bg-emerald-500/10", text: "text-emerald-300", label: "Light" },
  { maxRatio: 0.7, cell: "bg-primary/10", text: "text-primary", label: "Moderate" },
  { maxRatio: 0.999, cell: "bg-amber-500/15", text: "text-amber-300", label: "High" },
  { maxRatio: 1, cell: "bg-red-500/15", text: "text-red-300", label: "Full" },
] as const;

function densityStep(booked: number, total: number) {
  if (total <= 0 || booked <= 0) return DENSITY_STEPS[0];
  const ratio = booked / total;
  return DENSITY_STEPS.find((step) => ratio <= step.maxRatio) ?? DENSITY_STEPS[4];
}

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

interface CalendarRow {
  room: PhysicalRoomWithCategory;
  top: number;
}

interface ReservationStrip {
  reservation: Reservation;
  top: number;
  startCol: number;
  spanCols: number;
}

export function AvailabilityCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());

  const [rooms, setRooms] = useState<PhysicalRoomWithCategory[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [popoverReservation, setPopoverReservation] = useState<Reservation | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

  const [availableWidth, setAvailableWidth] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, []);

  useEffect(() => {
    return () => resizeObserverRef.current?.disconnect();
  }, []);

  const totalDays = daysInMonth(year, monthIndex);
  const monthStart = toIsoDate(year, monthIndex, 1);
  const monthEnd = toIsoDate(year, monthIndex, totalDays);
  const todayIso = todayIsoDate();

  const dayColumnWidth = Math.max(
    MIN_DAY_COLUMN_WIDTH,
    (availableWidth - ROOM_COLUMN_WIDTH) / totalDays,
  );

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

  // Flattened room rows (floor header rows interleaved) with a fixed pixel
  // "top" offset each, so reservation strips can be absolutely positioned
  // against the same coordinate space as the room grid beneath them.
  const { rowsByFloor, gridRows, totalGridHeight } = useMemo(() => {
    const rowsByFloor = new Map<number, CalendarRow[]>();
    const gridRows: Array<{ kind: "floor"; floorNumber: number; top: number } | { kind: "room"; room: PhysicalRoomWithCategory; top: number }> = [];

    let cursor = 0;
    for (const floorNumber of sortedFloorNumbers) {
      gridRows.push({ kind: "floor", floorNumber, top: cursor });
      cursor += ROW_HEIGHT * 0.7;

      const floorRows: CalendarRow[] = [];
      for (const room of floors.get(floorNumber) ?? []) {
        floorRows.push({ room, top: cursor });
        gridRows.push({ kind: "room", room, top: cursor });
        cursor += ROW_HEIGHT;
      }
      rowsByFloor.set(floorNumber, floorRows);
    }

    return { rowsByFloor, gridRows, totalGridHeight: cursor };
  }, [floors, sortedFloorNumbers]);

  const roomTopByNumber = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of gridRows) {
      if (row.kind === "room") map.set(row.room.room_number, row.top);
    }
    return map;
  }, [gridRows]);

  const strips = useMemo<ReservationStrip[]>(() => {
    const result: ReservationStrip[] = [];

    for (const reservation of reservations) {
      if (!reservation.room_number) continue;
      const top = roomTopByNumber.get(reservation.room_number);
      if (top === undefined) continue;

      const clampedStart =
        reservation.check_in_date < monthStart ? monthStart : reservation.check_in_date;
      const clampedEndExclusive =
        reservation.check_out_date > monthEnd
          ? toIsoDate(year, monthIndex, totalDays + 1)
          : reservation.check_out_date;

      const startDay = Number(clampedStart.slice(8, 10));
      const endDay =
        clampedEndExclusive > monthEnd
          ? totalDays + 1
          : Number(clampedEndExclusive.slice(8, 10));

      const startCol = startDay - 1;
      const spanCols = Math.max(endDay - startDay, 1);

      result.push({ reservation, top, startCol, spanCols });
    }

    return result;
  }, [reservations, roomTopByNumber, monthStart, monthEnd, year, monthIndex, totalDays]);

  // Distinct occupied rooms per day of the month, computed from the same
  // reservations dataset the timeline already loads — no extra fetch. The
  // check-out day is exclusive (a room freed by a morning departure is
  // sellable that night), matching the overlap queries used everywhere else.
  // A Set per day guards against any double-counted room even if two records
  // ever overlap on the same room.
  const dailyOccupancy = useMemo(() => {
    const occupied: Array<Set<string>> = Array.from(
      { length: totalDays },
      () => new Set<string>(),
    );

    for (const reservation of reservations) {
      if (!reservation.room_number) continue;
      for (let day = 1; day <= totalDays; day++) {
        const dayIso = toIsoDate(year, monthIndex, day);
        if (
          reservation.check_in_date <= dayIso &&
          reservation.check_out_date > dayIso
        ) {
          occupied[day - 1].add(reservation.room_number);
        }
      }
    }

    return occupied.map((rooms) => rooms.size);
  }, [reservations, totalDays, year, monthIndex]);

  const firstWeekdayOfMonth = new Date(year, monthIndex, 1).getDay();
  const totalRooms = rooms.length;

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

  const gridWidth = totalDays * dayColumnWidth;
  const todayDayIndex = todayIso >= monthStart && todayIso <= monthEnd
    ? Number(todayIso.slice(8, 10)) - 1
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Availability Calendar
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {viewMode === "timeline"
              ? "Booking distribution for every room across the whole month."
              : "How many rooms are booked on each day of the month."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-2 flex rounded-sm border border-white/15">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              aria-pressed={viewMode === "timeline"}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-wider transition-colors duration-300 ${
                viewMode === "timeline"
                  ? "bg-primary/15 text-primary"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Rows3 size={13} />
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode("density")}
              aria-pressed={viewMode === "density"}
              className={`flex items-center gap-1.5 border-l border-white/15 px-3 py-2 text-[11px] uppercase tracking-wider transition-colors duration-300 ${
                viewMode === "density"
                  ? "bg-primary/15 text-primary"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <LayoutGrid size={13} />
              Month View
            </button>
          </div>
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

      {!isLoading && !loadError && viewMode === "density" && (
        <div className="glass-panel rounded-xl p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="pb-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/40"
              >
                {label}
              </div>
            ))}

            {Array.from({ length: firstWeekdayOfMonth }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {dayNumbers.map((day) => {
              const booked = dailyOccupancy[day - 1] ?? 0;
              const step = densityStep(booked, totalRooms);
              const isToday = day - 1 === todayDayIndex;

              return (
                <div
                  key={day}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border sm:aspect-[4/3] ${step.cell} ${
                    isToday ? "border-primary/60" : "border-white/[0.06]"
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      isToday ? "text-primary" : "text-white/60"
                    }`}
                  >
                    {day}
                  </span>
                  <span className={`text-[11px] font-semibold ${step.text}`}>
                    {booked}/{totalRooms}
                  </span>
                </div>
              );
            })}
          </div>

          {totalRooms === 0 && (
            <div className="px-6 py-10 text-center text-sm text-white/40">
              No physical rooms configured yet.
            </div>
          )}
        </div>
      )}

      {!isLoading && !loadError && viewMode === "timeline" && (
        <div className="glass-panel rounded-xl">
          <div ref={scrollContainerRef} className="overflow-x-auto">
            <div style={{ width: Math.max(ROOM_COLUMN_WIDTH + gridWidth, availableWidth) }}>
              {/* Header row: day numbers */}
              <div className="sticky top-0 z-20 flex border-b border-white/10 bg-background-dark">
                <div
                  className="sticky left-0 z-30 flex shrink-0 items-center border-r border-white/10 bg-background-dark px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-white/40"
                  style={{ width: ROOM_COLUMN_WIDTH }}
                >
                  Room
                </div>
                {dayNumbers.map((day) => {
                  const isToday = day - 1 === todayDayIndex;
                  return (
                    <div
                      key={day}
                      className="flex shrink-0 items-center justify-center py-2.5"
                      style={{ width: dayColumnWidth }}
                    >
                      {isToday ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-background-dark shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.5)]">
                          {day}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-white/40">
                          {day}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Body: room labels (left, sticky) + relatively positioned grid with absolute strips */}
              <div className="relative flex">
                <div
                  className="sticky left-0 z-10 shrink-0 border-r border-white/10 bg-background-dark"
                  style={{ width: ROOM_COLUMN_WIDTH }}
                >
                  {sortedFloorNumbers.map((floorNumber) => (
                    <div key={floorNumber}>
                      <div
                        className="flex items-center bg-white/[0.03] px-4 text-[10px] uppercase tracking-[0.2em] text-primary/70"
                        style={{ height: ROW_HEIGHT * 0.7 }}
                      >
                        Fl. {floorNumber}
                      </div>
                      {(rowsByFloor.get(floorNumber) ?? []).map((row) => (
                        <div
                          key={row.room.room_number}
                          className="flex items-center border-t border-white/5 px-4 text-xs font-medium text-white/80"
                          style={{ height: ROW_HEIGHT }}
                        >
                          {row.room.room_number}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div
                  className="relative"
                  style={{ width: gridWidth, height: totalGridHeight }}
                >
                  {/* Vertical day gridlines */}
                  {dayNumbers.map((day) => (
                    <div
                      key={day}
                      className={`absolute top-0 bottom-0 border-r ${
                        day - 1 === todayDayIndex
                          ? "border-primary/25"
                          : "border-white/[0.04]"
                      }`}
                      style={{ left: (day - 1) * dayColumnWidth }}
                    />
                  ))}

                  {/* Row backgrounds (floor headers + room row dividers) */}
                  {gridRows.map((row) =>
                    row.kind === "floor" ? (
                      <div
                        key={`floor-${row.floorNumber}`}
                        className="absolute inset-x-0 bg-white/[0.03]"
                        style={{ top: row.top, height: ROW_HEIGHT * 0.7 }}
                      />
                    ) : (
                      <div
                        key={`room-${row.room.room_number}`}
                        className="absolute inset-x-0 border-t border-white/5"
                        style={{ top: row.top, height: ROW_HEIGHT }}
                      />
                    ),
                  )}

                  {/* Reservation strips */}
                  {strips.map(({ reservation, top, startCol, spanCols }) => {
                    const styles =
                      STATUS_STYLES[reservation.status] ?? STATUS_STYLES.Confirmed;
                    return (
                      <button
                        key={reservation.id}
                        type="button"
                        onClick={() =>
                          setPopoverReservation((current) =>
                            current?.id === reservation.id ? null : reservation,
                          )
                        }
                        title={`${reservation.guest_name ?? "Guest"} · ${reservation.check_in_date} — ${reservation.check_out_date}`}
                        className={`group absolute flex cursor-pointer appearance-none items-center gap-1.5 overflow-hidden rounded-lg border-0 border-l-2 border-solid px-2 text-left outline-none transition-all duration-200 hover:z-10 hover:brightness-125 ${styles.fill} ${styles.text}`}
                        style={{
                          top: top + 4,
                          height: ROW_HEIGHT - 8,
                          left: startCol * dayColumnWidth + 2,
                          width: spanCols * dayColumnWidth - 4,
                          borderLeftWidth: 2,
                          borderLeftColor: "currentColor",
                        }}
                      >
                        <span className="truncate text-[11px] font-medium">
                          {reservation.guest_name ?? "Guest"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {sortedFloorNumbers.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-white/40">
              No physical rooms configured yet.
            </div>
          )}
        </div>
      )}

      {viewMode === "timeline" ? (
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-indigo-500/10 border-l-2 border-indigo-400" />
            Checked-In
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500/10 border-l-2 border-amber-400" />
            Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-white/10" />
            Vacant
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
          {DENSITY_STEPS.map((step) => (
            <span key={step.label} className="flex items-center gap-1.5">
              <span
                className={`h-3 w-3 rounded-sm border border-white/[0.06] ${step.cell}`}
              />
              {step.label}
            </span>
          ))}
        </div>
      )}

      {popoverReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel max-h-[calc(100vh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl p-6">
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
    </div>
  );
}
