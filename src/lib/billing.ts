export function countNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return nights > 0 ? nights : 0;
}

export interface BillingBreakdown {
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

export function computeBilling(
  subtotal: number,
  discountAmount: number,
  taxRatePercent: number,
): BillingBreakdown {
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = taxableAmount * (taxRatePercent / 100);
  const total = taxableAmount + taxAmount;

  return { taxableAmount, taxAmount, total };
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
