import { X, Printer } from "lucide-react";
import { countNights, formatCurrency } from "../../lib/billing";
import type { Reservation, SystemConfiguration } from "../../types/database";

interface ReceiptModalProps {
  reservation: Reservation;
  config: SystemConfiguration;
  onClose: () => void;
}

const PROPERTY_NAME = "Hotel Kamala Inn Grand";
const PROPERTY_ADDRESS =
  "NH-28 Bypass Road, Padrauna, Kushinagar District, Uttar Pradesh - 274304";

function formatBookingId(id: string): string {
  return `KIG-${id.slice(0, 8).toUpperCase()}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReceiptModal({ reservation, config, onClose }: ReceiptModalProps) {
  const nights = countNights(reservation.check_in_date, reservation.check_out_date);
  const subtotal =
    reservation.total_amount - reservation.tax_amount + reservation.discount_amount;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:static print:bg-white print:p-0">
      <div className="print-receipt max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-8 text-neutral-900 print:max-h-none print:overflow-visible print:rounded-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between print:hidden">
          <div />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1.5 text-neutral-400 transition-colors duration-300 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold">{PROPERTY_NAME}</h1>
          <p className="mt-1 text-sm text-neutral-500">{PROPERTY_ADDRESS}</p>
          {config.tax_id && (
            <p className="mt-1 text-xs text-neutral-500">Tax ID: {config.tax_id}</p>
          )}
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Booking Reference</span>
            <span className="font-mono font-medium">
              {formatBookingId(reservation.id)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-neutral-500">Guest Name</span>
            <span className="font-medium">{reservation.guest_name ?? "—"}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-neutral-500">Room</span>
            <span className="font-medium">
              {reservation.room_number ? `Room ${reservation.room_number}` : "—"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-neutral-500">Stay Dates</span>
            <span className="font-medium">
              {formatDate(reservation.check_in_date)} —{" "}
              {formatDate(reservation.check_out_date)} ({nights} night
              {nights === 1 ? "" : "s"})
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-200 pt-6 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {reservation.discount_amount > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-neutral-500">Discount</span>
              <span>-{formatCurrency(reservation.discount_amount)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-neutral-500">
              Tax ({config.tax_rate}%)
            </span>
            <span>{formatCurrency(reservation.tax_amount)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold">
            <span>Total Amount</span>
            <span>{formatCurrency(reservation.total_amount)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-neutral-500">Amount Paid</span>
            <span>{formatCurrency(reservation.amount_paid)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-base font-semibold">
            <span>Balance Due / Outstanding</span>
            <span>
              {formatCurrency(
                Math.max(reservation.total_amount - reservation.amount_paid, 0),
              )}
            </span>
          </div>
        </div>

        {config.invoice_terms && (
          <div className="mt-6 border-t border-neutral-200 pt-6">
            <p className="text-xs uppercase tracking-wider text-neutral-400">
              Terms
            </p>
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-neutral-500">
              {config.invoice_terms}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handlePrint}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-sm bg-neutral-900 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity duration-300 hover:opacity-90 print:hidden"
        >
          <Printer size={14} />
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
