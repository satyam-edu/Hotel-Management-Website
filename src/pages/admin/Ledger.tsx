import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  AlertTriangle,
  Calendar,
  ChevronDown,
  Download,
  FileText,
  LogIn,
  LogOut,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { downloadCsv } from "../../lib/csv";
import { formatCurrency } from "../../lib/billing";
import {
  loadPhysicalRooms,
  loadRoomCategories,
  type PhysicalRoomWithCategory,
} from "../../lib/rooms";
import { useSystemContext } from "../../context/SystemContext";
import { useAuth } from "../../context/AuthContext";
import { logAction } from "../../lib/audit";
import { EditLedgerModal } from "./EditLedgerModal";
import { ReceiptModal } from "./ReceiptModal";
import type {
  AuditActionType,
  PaymentStatus,
  Reservation,
  ReservationStatus,
  RoomCategory,
} from "../../types/database";

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

const PAYMENT_STATUS_BADGE_STYLES: Record<PaymentStatus, string> = {
  paid: "bg-emerald-400/10 text-emerald-300",
  partial: "bg-amber-400/10 text-amber-300",
  unpaid: "bg-red-400/10 text-red-300",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  unpaid: "Unpaid",
};

function formatDateRange(checkIn: string, checkOut: string): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  return `${format(checkIn)} — ${format(checkOut)}`;
}

function formatBookingId(id: string): string {
  return `KIG-${id.slice(0, 8).toUpperCase()}`;
}

function formatOccupancy(adults: number, children: number): string {
  return children > 0 ? `${adults}A, ${children}C` : `${adults}A`;
}

function canEditLedger(reservation: Reservation): boolean {
  if (reservation.status === "Cancelled") return false;
  if (reservation.status !== "Checked-Out") return true;
  return reservation.payment_status === "partial" || reservation.payment_status === "unpaid";
}

function canCancelOrReassign(status: ReservationStatus): boolean {
  return status !== "Checked-Out" && status !== "Cancelled";
}

interface ActionsMenuProps {
  anchorEl: HTMLElement;
  onClose: () => void;
  children: ReactNode;
}

function ActionsMenu({ anchorEl, onClose, children }: ActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useEffect(() => {
    function updatePosition() {
      const rect = anchorEl.getBoundingClientRect();
      const menuWidth = 256;
      const viewportPadding = 8;

      const left = Math.min(
        rect.right - menuWidth,
        window.innerWidth - menuWidth - viewportPadding,
      );

      const estimatedMenuHeight = menuRef.current?.offsetHeight ?? 220;
      const fitsBelow =
        rect.bottom + 4 + estimatedMenuHeight <= window.innerHeight;

      const top = fitsBelow
        ? rect.bottom + 4
        : rect.top - estimatedMenuHeight - 4;

      setPosition({ top, left });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [anchorEl]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !anchorEl.contains(target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorEl, onClose]);

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        visibility: position ? "visible" : "hidden",
      }}
      className="glass-panel z-50 w-64 rounded-sm p-1"
    >
      {children}
    </div>,
    document.body,
  );
}

export function Ledger() {
  const { config } = useSystemContext();
  const { user, role } = useAuth();
  const isMasterAdmin = role === "master_admin";

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);
  const [physicalRooms, setPhysicalRooms] = useState<PhysicalRoomWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<"active" | "archived">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ReservationStatus>(
    "All",
  );
  const [roomTypeFilter, setRoomTypeFilter] = useState<"All" | string>("All");
  const [checkInFrom, setCheckInFrom] = useState("");
  const [checkInTo, setCheckInTo] = useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    reservationId: string;
    action: "Checked-Out" | "Cancelled";
  } | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(
    null,
  );
  const [receiptReservation, setReceiptReservation] = useState<Reservation | null>(
    null,
  );
  const [deletingReservation, setDeletingReservation] = useState<Reservation | null>(
    null,
  );
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [hardDeleteError, setHardDeleteError] = useState<string | null>(null);
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const roomNumberToCategory = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of physicalRooms) {
      map.set(room.room_number, room.category_name);
    }
    return map;
  }, [physicalRooms]);

  async function loadReservations() {
    if (!supabase) {
      setLoadError("Database connection is not configured.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    const [reservationsResult, categoriesResult, roomsResult] = await Promise.all([
      supabase.from("reservations").select("*").order("created_at", {
        ascending: false,
      }),
      loadRoomCategories(),
      loadPhysicalRooms(),
    ]);

    if (reservationsResult.error) {
      console.error("Failed to load reservations:", reservationsResult.error.message);
      setLoadError("Could not load the ledger. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    setReservations(reservationsResult.data ?? []);
    setRoomCategories(categoriesResult.data);
    setPhysicalRooms(roomsResult.data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function updateReservationStatus(
    reservation: Reservation,
    status: ReservationStatus,
  ) {
    if (!supabase) {
      setActionError("Database connection is not configured.");
      return;
    }

    setUpdatingId(reservation.id);
    setActionError(null);
    setOpenMenuId(null);
    setPendingConfirmation(null);

    const isCancelling = status === "Cancelled";

    const { error } = await supabase
      .from("reservations")
      .update(isCancelling ? { status, is_cancelled: true } : { status })
      .eq("id", reservation.id);

    if (error) {
      setUpdatingId(null);
      console.error("Failed to update reservation status:", error.message);
      setActionError("Could not update this booking. Please try again.");
      return;
    }

    if (user) {
      const actionType: AuditActionType =
        status === "Checked-In"
          ? "check_in"
          : status === "Checked-Out"
            ? "check_out"
            : "cancel_booking";
      await logAction(
        user.id,
        actionType,
        `${status} — ${reservation.guest_name ?? "guest"} (Room ${reservation.room_number ?? "—"}, ${formatBookingId(reservation.id)})`,
      );
    }

    setUpdatingId(null);
    await loadReservations();
  }

  async function handleRestore(reservation: Reservation) {
    if (!supabase) {
      setActionError("Database connection is not configured.");
      return;
    }

    setUpdatingId(reservation.id);
    setActionError(null);

    const { error } = await supabase
      .from("reservations")
      .update({ is_cancelled: false, status: "Confirmed" })
      .eq("id", reservation.id);

    if (error) {
      setUpdatingId(null);
      console.error("Failed to restore reservation:", error.message);
      setActionError("Could not restore this booking. Please try again.");
      return;
    }

    if (user) {
      await logAction(
        user.id,
        "restore_booking",
        `Restored booking for ${reservation.guest_name ?? "guest"} (Room ${reservation.room_number ?? "—"}, ${formatBookingId(reservation.id)})`,
      );
    }

    setUpdatingId(null);
    await loadReservations();
  }

  async function handleHardDelete() {
    if (!supabase || !deletingReservation) return;

    setIsHardDeleting(true);
    setHardDeleteError(null);

    // The master_admin check is re-enforced inside the RPC itself — this
    // client-side gate is UX only, not the real protection.
    const { error } = await supabase.rpc("hard_delete_reservation", {
      target_reservation_id: deletingReservation.id,
    });

    setIsHardDeleting(false);

    if (error) {
      console.error("Failed to permanently delete reservation:", error.message);
      setHardDeleteError("Could not delete this booking. Please try again.");
      return;
    }

    setDeletingReservation(null);
    await loadReservations();
  }

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const matchesView =
        view === "active" ? !reservation.is_cancelled : reservation.is_cancelled;

      const matchesStatus =
        statusFilter === "All" || reservation.status === statusFilter;

      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === "" ||
        (reservation.guest_name?.toLowerCase().includes(term) ?? false) ||
        (reservation.guest_phone?.toLowerCase().includes(term) ?? false) ||
        reservation.id.toLowerCase().includes(term);

      const matchesRoomType =
        roomTypeFilter === "All" ||
        (reservation.room_number
          ? roomNumberToCategory.get(reservation.room_number) === roomTypeFilter
          : false);

      const matchesCheckInFrom =
        checkInFrom === "" || reservation.check_in_date >= checkInFrom;
      const matchesCheckInTo =
        checkInTo === "" || reservation.check_in_date <= checkInTo;

      return (
        matchesView &&
        matchesStatus &&
        matchesSearch &&
        matchesRoomType &&
        matchesCheckInFrom &&
        matchesCheckInTo
      );
    });
  }, [
    reservations,
    view,
    searchTerm,
    statusFilter,
    roomTypeFilter,
    checkInFrom,
    checkInTo,
    roomNumberToCategory,
  ]);

  function handleExportCsv() {
    downloadCsv(
      `ledger-export-${view}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Booking ID",
        "Guest Name",
        "Phone",
        "Room",
        "Check-In",
        "Check-Out",
        "Adults",
        "Children",
        "Total Amount",
        "Discount",
        "Amount Paid",
        "Balance Due",
        "Payment Status",
        "Status",
        "Internal Notes",
      ],
      filteredReservations.map((reservation) => [
        formatBookingId(reservation.id),
        reservation.guest_name ?? "",
        reservation.guest_phone ?? "",
        reservation.room_number ?? "",
        reservation.check_in_date,
        reservation.check_out_date,
        reservation.adults,
        reservation.children,
        reservation.total_amount,
        reservation.discount_amount,
        reservation.amount_paid,
        reservation.total_amount - reservation.amount_paid,
        reservation.payment_status,
        reservation.status,
        reservation.internal_notes,
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Master Ledger
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Every reservation, searchable and filterable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-sm border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setView("active")}
              className={`rounded-sm px-3 py-1.5 text-xs uppercase tracking-wider transition-colors duration-300 ${
                view === "active"
                  ? "bg-primary text-background-dark"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setView("archived")}
              className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs uppercase tracking-wider transition-colors duration-300 ${
                view === "archived"
                  ? "bg-primary text-background-dark"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Archive size={12} />
              Archived
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs uppercase tracking-widest text-white/70 transition-colors duration-300 hover:bg-white/5 hover:text-white"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, or booking ID…"
            className="w-full rounded-sm border border-white/10 bg-white/[0.06] py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary"
          />
        </div>

        {view === "active" && (
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "All" | ReservationStatus)
              }
              className="w-full appearance-none rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 pr-9 text-sm text-white outline-none transition-colors duration-300 focus:border-primary"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status} className="bg-background-dark">
                  {status === "All" ? "All Statuses" : status}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
            />
          </div>
        )}

        <div className="relative">
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="w-full appearance-none rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 pr-9 text-sm text-white outline-none transition-colors duration-300 focus:border-primary"
          >
            <option value="All" className="bg-background-dark">
              All Room Types
            </option>
            {roomCategories.map((category) => (
              <option
                key={category.id}
                value={category.name}
                className="bg-background-dark"
              >
                {category.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Calendar
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="date"
              value={checkInFrom}
              onChange={(e) => setCheckInFrom(e.target.value)}
              aria-label="Check-in from"
              className="w-full rounded-sm border border-white/10 bg-white/[0.06] py-2.5 pl-9 pr-2 text-sm text-white outline-none transition-colors duration-300 focus:border-primary"
            />
          </div>
          <span className="text-xs text-white/40">to</span>
          <div className="relative flex-1">
            <input
              type="date"
              value={checkInTo}
              min={checkInFrom || undefined}
              onChange={(e) => setCheckInTo(e.target.value)}
              aria-label="Check-in to"
              className="w-full rounded-sm border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none transition-colors duration-300 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {actionError && (
        <p className="text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}

      <div className="glass-panel overflow-x-auto rounded-xl">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="px-6 py-4 font-medium">Booking ID</th>
              <th className="px-6 py-4 font-medium">Guest Name</th>
              <th className="px-6 py-4 font-medium">Phone</th>
              <th className="px-6 py-4 font-medium">Room</th>
              <th className="px-6 py-4 font-medium">Occupancy</th>
              <th className="px-6 py-4 font-medium">Dates</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-6 py-10">
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
                  colSpan={9}
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
                    {reservation.guest_phone ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-white/70">
                    {reservation.room_number
                      ? `Room ${reservation.room_number}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                      {formatOccupancy(reservation.adults, reservation.children)}
                    </span>
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
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">
                      {formatCurrency(reservation.total_amount)}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PAYMENT_STATUS_BADGE_STYLES[reservation.payment_status]}`}
                    >
                      {PAYMENT_STATUS_LABELS[reservation.payment_status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE_STYLES[reservation.status]}`}
                    >
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {view === "archived" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={updatingId === reservation.id}
                          onClick={() => handleRestore(reservation)}
                          className="flex items-center gap-1.5 rounded-sm border border-white/15 px-3 py-1.5 text-xs uppercase tracking-wider text-white/70 transition-colors duration-300 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={13} />
                          Restore
                        </button>
                        {isMasterAdmin && (
                          <button
                            type="button"
                            aria-label={`Permanently delete booking ${formatBookingId(reservation.id)}`}
                            onClick={() => {
                              setHardDeleteError(null);
                              setDeletingReservation(reservation);
                            }}
                            className="rounded-sm border border-red-400/25 p-2 text-red-400 transition-colors duration-300 hover:bg-red-400/10"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        ref={(el) => {
                          if (el) triggerRefs.current.set(reservation.id, el);
                          else triggerRefs.current.delete(reservation.id);
                        }}
                        disabled={updatingId === reservation.id}
                        onClick={() => {
                          setPendingConfirmation(null);
                          setOpenMenuId((current) =>
                            current === reservation.id ? null : reservation.id,
                          );
                        }}
                        aria-label={`Actions for ${formatBookingId(reservation.id)}`}
                        className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {updatingId === reservation.id ? (
                          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
                        ) : (
                          <MoreVertical size={16} />
                        )}
                      </button>
                    )}

                    {view === "active" &&
                      openMenuId === reservation.id &&
                      triggerRefs.current.get(reservation.id) && (
                        <ActionsMenu
                          anchorEl={triggerRefs.current.get(reservation.id)!}
                          onClose={() => {
                            setOpenMenuId(null);
                            setPendingConfirmation(null);
                          }}
                        >
                          {pendingConfirmation?.reservationId === reservation.id ? (
                            <div className="p-3">
                              <p className="px-1 text-sm font-medium text-white/90">
                                {pendingConfirmation.action === "Checked-Out"
                                  ? "Are you sure you want to mark this booking as Checked-Out?"
                                  : "Are you sure you want to cancel this reservation?"}
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateReservationStatus(
                                      reservation,
                                      pendingConfirmation.action,
                                    )
                                  }
                                  className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors duration-300 ${
                                    pendingConfirmation.action === "Cancelled"
                                      ? "bg-red-400/15 text-red-300 hover:bg-red-400/25"
                                      : "bg-primary/15 text-primary hover:bg-primary/25"
                                  }`}
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingConfirmation(null)}
                                  className="flex-1 rounded-sm bg-white/5 py-2 text-sm font-medium text-white/60 transition-colors duration-300 hover:bg-white/10"
                                >
                                  Go Back
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {reservation.status === "Confirmed" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateReservationStatus(
                                      reservation,
                                      "Checked-In",
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-sm px-4 py-3 text-left text-sm font-medium text-emerald-300 transition-colors duration-300 hover:bg-white/5"
                                >
                                  <LogIn size={14} />
                                  Check In
                                </button>
                              )}

                              {reservation.status === "Checked-In" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingConfirmation({
                                      reservationId: reservation.id,
                                      action: "Checked-Out",
                                    })
                                  }
                                  className="flex w-full items-center gap-2 rounded-sm px-4 py-3 text-left text-sm font-medium text-white/70 transition-colors duration-300 hover:bg-white/5"
                                >
                                  <LogOut size={14} />
                                  Check Out
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={!canEditLedger(reservation)}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setEditingReservation(reservation);
                                }}
                                className="flex w-full items-center gap-2 rounded-sm px-4 py-3 text-left text-sm font-medium text-white/70 transition-colors duration-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Pencil size={14} />
                                Edit Ledger
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setReceiptReservation(reservation);
                                }}
                                className="flex w-full items-center gap-2 rounded-sm px-4 py-3 text-left text-sm font-medium text-white/70 transition-colors duration-300 hover:bg-white/5"
                              >
                                <FileText size={14} />
                                Generate Receipt
                              </button>

                              {canCancelOrReassign(reservation.status) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingConfirmation({
                                      reservationId: reservation.id,
                                      action: "Cancelled",
                                    })
                                  }
                                  className="flex w-full items-center gap-2 rounded-sm px-4 py-3 text-left text-sm font-medium text-red-400 transition-colors duration-300 hover:bg-white/5"
                                >
                                  <XCircle size={14} />
                                  Cancel Booking
                                </button>
                              )}

                              {isMasterAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setHardDeleteError(null);
                                    setDeletingReservation(reservation);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-sm border-t border-white/5 px-4 py-3 text-left text-sm font-medium text-red-400 transition-colors duration-300 hover:bg-red-400/10"
                                >
                                  <Trash2 size={14} />
                                  Permanently Delete Booking
                                </button>
                              )}
                            </>
                          )}
                        </ActionsMenu>
                      )}
                  </td>
                </tr>
              ))}

            {!isLoading && !loadError && filteredReservations.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-10 text-center text-sm text-white/40"
                >
                  {view === "archived"
                    ? "No archived bookings match your search."
                    : "No reservations match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingReservation && (
        <EditLedgerModal
          reservation={editingReservation}
          rooms={physicalRooms}
          taxRatePercent={config.tax_rate}
          onClose={() => setEditingReservation(null)}
          onSaved={() => {
            setEditingReservation(null);
            loadReservations();
          }}
        />
      )}

      {receiptReservation && (
        <ReceiptModal
          reservation={receiptReservation}
          config={config}
          onClose={() => setReceiptReservation(null)}
        />
      )}

      {deletingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-md rounded-xl border border-red-400/25 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <AlertTriangle size={22} className="mt-0.5 shrink-0 text-red-400" />
              <div>
                <h2 className="font-display text-lg font-semibold text-red-300">
                  Permanently Delete Booking
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Warning: This will permanently erase this booking record
                  from the relational store. This action is irreversible.
                </p>
                <p className="mt-3 text-sm text-white/50">
                  {deletingReservation.guest_name ?? "Guest"} ·{" "}
                  {formatBookingId(deletingReservation.id)} · Room{" "}
                  {deletingReservation.room_number ?? "—"}
                </p>
              </div>
            </div>

            {hardDeleteError && (
              <p className="mt-4 text-sm text-red-400" role="alert">
                {hardDeleteError}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingReservation(null)}
                className="rounded-sm border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isHardDeleting}
                onClick={handleHardDelete}
                className="rounded-sm bg-red-500/80 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isHardDeleting ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
