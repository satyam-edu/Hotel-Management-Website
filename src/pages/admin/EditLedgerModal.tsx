import { useState } from "react";
import { X } from "lucide-react";
import { countNights, computeBilling, formatCurrency } from "../../lib/billing";
import { updateVerifiedReservation } from "../../lib/reservationVerification";
import type { PaymentStatus, Reservation } from "../../types/database";

interface EditLedgerModalProps {
  reservation: Reservation;
  taxRatePercent: number;
  onClose: () => void;
  onSaved: () => void;
}

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["unpaid", "partial", "paid"];

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

export function EditLedgerModal({
  reservation,
  taxRatePercent,
  onClose,
  onSaved,
}: EditLedgerModalProps) {
  const nights = countNights(reservation.check_in_date, reservation.check_out_date);
  const impliedNightlyRate =
    nights > 0
      ? (reservation.total_amount - reservation.tax_amount + reservation.discount_amount) /
        nights
      : reservation.total_amount;

  const [discountAmount, setDiscountAmount] = useState(
    String(reservation.discount_amount),
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    reservation.payment_status,
  );
  const [amountReceived, setAmountReceived] = useState(
    String(reservation.amount_paid),
  );
  const [internalNotes, setInternalNotes] = useState(reservation.internal_notes);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const parsedDiscount = Number(discountAmount) || 0;
  const subtotal = impliedNightlyRate * nights;
  const billing = computeBilling(subtotal, parsedDiscount, taxRatePercent);

  const amountPaid = Math.min(Math.max(Number(amountReceived) || 0, 0), billing.total);
  const balanceDue = Math.max(billing.total - amountPaid, 0);

  const reconciledStatus: PaymentStatus =
    amountPaid >= billing.total
      ? "paid"
      : amountPaid <= 0
        ? "unpaid"
        : "partial";

  function handleAmountReceivedChange(value: string) {
    setAmountReceived(value);
    const parsed = Math.min(Math.max(Number(value) || 0, 0), billing.total);
    setPaymentStatus(parsed >= billing.total ? "paid" : parsed <= 0 ? "unpaid" : "partial");
  }

  function handlePaymentStatusChange(status: PaymentStatus) {
    setPaymentStatus(status);
    if (status === "paid") setAmountReceived(String(billing.total));
    if (status === "unpaid") setAmountReceived("0");
  }

  async function handleSave() {
    if (parsedDiscount < 0 || parsedDiscount > subtotal) {
      setSaveError("Discount must be between 0 and the subtotal.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    // `billing`/`amountPaid`/`reconciledStatus` above are a preview computed
    // from the reservation's *implied* rate — the Edge Function re-reads the
    // room category's actual current nightly rate and tax rate and is what
    // actually gets written.
    const result = await updateVerifiedReservation({
      reservation_id: reservation.id,
      discount_amount: parsedDiscount,
      amount_received: amountPaid,
      payment_status_override: paymentStatus,
      internal_notes: internalNotes,
      client_total_amount: billing.total,
      client_tax_amount: billing.taxAmount,
    });

    setIsSaving(false);

    if (result.errorMessage) {
      console.error("Failed to update reservation:", result.errorMessage);
      setSaveError("Could not save these changes. Please try again.");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-panel w-full max-w-lg rounded-xl p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              Edit Booking
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {reservation.guest_name ?? "—"} · Room {reservation.room_number ?? "—"}
            </p>
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

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="discountAmount" className={labelClasses}>
              Discount (₹)
            </label>
            <input
              id="discountAmount"
              type="number"
              min={0}
              max={subtotal}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="amountReceived" className={labelClasses}>
              Amount Received (₹)
            </label>
            <input
              id="amountReceived"
              type="number"
              min={0}
              max={billing.total}
              value={amountReceived}
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
              value={paymentStatus}
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
            {paymentStatus !== reconciledStatus && (
              <p className="mt-1.5 text-xs text-amber-300">
                Will save as{" "}
                <span className="font-semibold capitalize">{reconciledStatus}</span>{" "}
                based on the amount received.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="internalNotes" className={labelClasses}>
              Internal Notes
            </label>
            <textarea
              id="internalNotes"
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Special requests, internal remarks…"
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="rounded-sm border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Nights</span>
              <span className="text-white">{nights}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Subtotal</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Taxable Amount</span>
              <span className="text-white">
                {formatCurrency(billing.taxableAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/60">Tax ({taxRatePercent}%)</span>
              <span className="text-white">{formatCurrency(billing.taxAmount)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
              <span className="font-semibold text-white">Total</span>
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

          {saveError && (
            <p className="text-sm text-red-400" role="alert">
              {saveError}
            </p>
          )}
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="rounded-sm bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
