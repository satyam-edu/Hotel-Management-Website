import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BedDouble,
  Calendar,
  IndianRupee,
  Phone,
  User,
  Users,
  X,
} from "lucide-react";
import { todayIsoDate } from "../../lib/date";
import { countNights, computeBilling, formatCurrency } from "../../lib/billing";
import { checkRoomAvailability } from "../../lib/rooms";
import { createVerifiedReservation } from "../../lib/reservationVerification";
import type { PhysicalRoomWithCategory } from "../../lib/rooms";
import type { PendingEnquiry } from "../../lib/enquiries";
import type { PaymentStatus } from "../../types/database";

interface WalkInBookingModalProps {
  rooms: PhysicalRoomWithCategory[];
  taxRatePercent: number;
  fromEnquiry?: PendingEnquiry;
  initialRoomNumber?: string;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  guestName: string;
  phone: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  discountAmount: string;
  paymentStatus: PaymentStatus;
  amountReceived: string;
  internalNotes: string;
}

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["unpaid", "partial", "paid"];

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses =
  "mb-1.5 flex items-center gap-1.5 text-xs tracking-wide text-white/50";

export function WalkInBookingModal({
  rooms,
  taxRatePercent,
  fromEnquiry,
  initialRoomNumber,
  onClose,
  onSaved,
}: WalkInBookingModalProps) {
  const [form, setForm] = useState<FormState>(() => ({
    guestName: fromEnquiry?.full_name ?? "",
    phone: fromEnquiry?.mobile ?? "",
    roomNumber: initialRoomNumber ?? rooms[0]?.room_number ?? "",
    checkIn: fromEnquiry?.check_in_date ?? (initialRoomNumber ? todayIsoDate() : ""),
    checkOut: fromEnquiry?.check_out_date ?? "",
    adults: fromEnquiry?.adults ?? 2,
    children: fromEnquiry?.children ?? 0,
    discountAmount: "0",
    paymentStatus: "unpaid",
    amountReceived: "0",
    internalNotes: "",
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [noCategoryRoomsAvailable, setNoCategoryRoomsAvailable] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    if (!fromEnquiry?.room_type_id || !fromEnquiry.check_in_date || !fromEnquiry.check_out_date) {
      return;
    }

    const candidateRooms = rooms.filter(
      (room) => room.category_id === fromEnquiry.room_type_id,
    );

    if (candidateRooms.length === 0) return;

    let isCancelled = false;

    async function findAvailableRoom() {
      for (const room of candidateRooms) {
        const result = await checkRoomAvailability(
          room.room_number,
          fromEnquiry!.check_in_date,
          fromEnquiry!.check_out_date,
        );
        if (isCancelled) return;
        if (result.isAvailable) {
          setForm((prev) => ({ ...prev, roomNumber: room.room_number }));
          return;
        }
      }
      if (!isCancelled) {
        setNoCategoryRoomsAvailable(true);
      }
    }

    findAvailableRoom();

    return () => {
      isCancelled = true;
    };
  }, [fromEnquiry, rooms]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.room_number === form.roomNumber) ?? null,
    [rooms, form.roomNumber],
  );

  const nights = countNights(form.checkIn, form.checkOut);
  const subtotal = (selectedRoom?.nightly_rate ?? 0) * nights;
  const parsedDiscount = Number(form.discountAmount) || 0;
  const billing = computeBilling(subtotal, parsedDiscount, taxRatePercent);

  const amountPaid =
    form.paymentStatus === "paid"
      ? billing.total
      : form.paymentStatus === "unpaid"
        ? 0
        : Math.min(Math.max(Number(form.amountReceived) || 0, 0), billing.total);

  const balanceDue = Math.max(billing.total - amountPaid, 0);

  function handleAmountReceivedChange(value: string) {
    updateField("amountReceived", value);
    const parsed = Math.min(Math.max(Number(value) || 0, 0), billing.total);
    updateField(
      "paymentStatus",
      parsed >= billing.total ? "paid" : parsed <= 0 ? "unpaid" : "partial",
    );
  }

  function handlePaymentStatusChange(status: PaymentStatus) {
    updateField("paymentStatus", status);
    if (status === "paid") updateField("amountReceived", String(billing.total));
    if (status === "unpaid") updateField("amountReceived", "0");
  }

  const capacityWarning = useMemo(() => {
    if (!selectedRoom) return null;
    if (form.adults > selectedRoom.max_adults) {
      return `${selectedRoom.category_name} rooms allow a maximum of ${selectedRoom.max_adults} adult${selectedRoom.max_adults === 1 ? "" : "s"}.`;
    }
    if (form.children > selectedRoom.max_children) {
      return `${selectedRoom.category_name} rooms allow a maximum of ${selectedRoom.max_children} child${selectedRoom.max_children === 1 ? "" : "ren"}.`;
    }
    return null;
  }, [selectedRoom, form.adults, form.children]);

  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isRoomUnavailable, setIsRoomUnavailable] = useState(false);

  useEffect(() => {
    if (!form.roomNumber || !form.checkIn || !form.checkOut || nights <= 0) {
      setIsRoomUnavailable(false);
      return;
    }

    let isCancelled = false;
    setIsCheckingAvailability(true);

    checkRoomAvailability(form.roomNumber, form.checkIn, form.checkOut).then(
      (result) => {
        if (isCancelled) return;
        setIsRoomUnavailable(!result.isAvailable);
        setIsCheckingAvailability(false);
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [form.roomNumber, form.checkIn, form.checkOut, nights]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (capacityWarning) {
      setSubmitError(capacityWarning);
      return;
    }

    if (nights <= 0) {
      setSubmitError("Check-out date must be after check-in date.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const availability = await checkRoomAvailability(
      form.roomNumber,
      form.checkIn,
      form.checkOut,
    );

    if (!availability.isAvailable) {
      setIsSubmitting(false);
      setIsRoomUnavailable(true);
      setSubmitError(
        `Room ${form.roomNumber} is already occupied or booked for these dates.`,
      );
      return;
    }

    // The client-computed `billing`/`amountPaid`/`reconciledStatus` above are
    // preview-only — the Edge Function independently re-derives the
    // authoritative rate and tax and is what actually gets written.
    const result = await createVerifiedReservation({
      room_number: form.roomNumber,
      check_in_date: form.checkIn,
      check_out_date: form.checkOut,
      adults: form.adults,
      children: form.children,
      guest_name: form.guestName,
      guest_phone: form.phone,
      discount_amount: parsedDiscount,
      amount_received: amountPaid,
      payment_status_override: form.paymentStatus,
      internal_notes: form.internalNotes,
      from_enquiry_id: fromEnquiry?.id,
      client_total_amount: billing.total,
      client_tax_amount: billing.taxAmount,
    });

    setIsSubmitting(false);

    if (result.errorCode === "room_unavailable") {
      setIsRoomUnavailable(true);
      setSubmitError(result.errorMessage);
      return;
    }

    if (result.errorMessage) {
      console.error("Failed to create reservation:", result.errorMessage);
      setSubmitError("Could not save this booking. Please try again.");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-panel max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              New Walk-In Booking
            </h2>
            {fromEnquiry && (
              <p className="mt-1 text-xs uppercase tracking-wider text-primary">
                Converting enquiry {fromEnquiry.reference_code}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/80"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {noCategoryRoomsAvailable && (
              <p
                className="flex items-start gap-2 rounded-sm border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-300"
                role="alert"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                No {fromEnquiry?.room_type_name ?? "requested"} rooms are free
                for these dates. Please select an alternative room below.
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
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
                  {rooms.map((room) => (
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="adults" className={labelClasses}>
                    <Users size={14} />
                    Adults
                  </label>
                  <input
                    id="adults"
                    type="number"
                    min={1}
                    required
                    value={form.adults}
                    onChange={(e) => updateField("adults", Number(e.target.value))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="children" className={labelClasses}>
                    <Users size={14} />
                    Children
                  </label>
                  <input
                    id="children"
                    type="number"
                    min={0}
                    value={form.children}
                    onChange={(e) => updateField("children", Number(e.target.value))}
                    className={inputClasses}
                  />
                </div>
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

              <div>
                <label htmlFor="discountAmount" className={labelClasses}>
                  <IndianRupee size={14} />
                  Discount (₹)
                </label>
                <input
                  id="discountAmount"
                  type="number"
                  min={0}
                  max={subtotal}
                  value={form.discountAmount}
                  onChange={(e) => updateField("discountAmount", e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="amountReceived" className={labelClasses}>
                  <IndianRupee size={14} />
                  Amount Received (₹)
                </label>
                <input
                  id="amountReceived"
                  type="number"
                  min={0}
                  max={billing.total}
                  value={form.amountReceived}
                  onChange={(e) => handleAmountReceivedChange(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="paymentStatus" className={labelClasses}>
                  Payment Status
                </label>
                <select
                  id="paymentStatus"
                  value={form.paymentStatus}
                  onChange={(e) =>
                    handlePaymentStatusChange(e.target.value as PaymentStatus)
                  }
                  className={inputClasses}
                >
                  {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="bg-background-dark">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="internalNotes" className={labelClasses}>
                  Internal Notes
                </label>
                <textarea
                  id="internalNotes"
                  rows={2}
                  value={form.internalNotes}
                  onChange={(e) => updateField("internalNotes", e.target.value)}
                  placeholder="Special requests, internal remarks…"
                  className={`${inputClasses} resize-none`}
                />
              </div>
            </div>

            {isRoomUnavailable && (
              <p
                className="flex items-start gap-2 rounded-sm border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-300"
                role="alert"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                Room {form.roomNumber} is already occupied or booked for these
                dates.
              </p>
            )}

            {capacityWarning && (
              <p
                className="flex items-start gap-2 rounded-sm border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-300"
                role="alert"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                {capacityWarning}
              </p>
            )}

            {submitError && (
              <p className="text-sm text-red-400" role="alert">
                {submitError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  Boolean(capacityWarning) ||
                  isRoomUnavailable ||
                  isCheckingAvailability
                }
                className="rounded-sm bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving…"
                  : isCheckingAvailability
                    ? "Checking availability…"
                    : "Confirm Booking"}
              </button>
            </div>
          </div>

          <div className="h-fit rounded-sm border border-white/10 bg-white/[0.03] p-5 text-sm">
            <h3 className="text-xs uppercase tracking-wider text-white/40">
              Billing Summary
            </h3>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-white/60">Nights</span>
              <span className="text-white">{nights}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Nightly Rate</span>
              <span className="text-white">
                {formatCurrency(selectedRoom?.nightly_rate ?? 0)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Subtotal</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Discount</span>
              <span className="text-white">-{formatCurrency(parsedDiscount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Taxable Amount</span>
              <span className="text-white">
                {formatCurrency(billing.taxableAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">GST ({taxRatePercent}%)</span>
              <span className="text-white">{formatCurrency(billing.taxAmount)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="font-semibold text-white">Gross Total</span>
              <span className="font-display text-lg font-semibold text-primary">
                {formatCurrency(billing.total)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Amount Paid</span>
              <span className="text-white">{formatCurrency(amountPaid)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Balance Due</span>
              <span className="text-white">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
