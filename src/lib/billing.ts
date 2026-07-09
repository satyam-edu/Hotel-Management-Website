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

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigitsToWords(value: number): string {
  if (value < 20) return ONES[value];
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return ones > 0 ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function threeDigitsToWords(value: number): string {
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const hundredsPart = hundreds > 0 ? `${ONES[hundreds]} Hundred` : "";
  const restPart = rest > 0 ? twoDigitsToWords(rest) : "";
  return [hundredsPart, restPart].filter(Boolean).join(" ");
}

// Indian numbering (lakh/crore groups), not the international thousand/million
// grouping — matches how GST invoices in India conventionally spell amounts.
export function amountInWords(amount: number): string {
  const whole = Math.round(Math.max(amount, 0));
  if (whole === 0) return "Zero Rupees Only";

  const crore = Math.floor(whole / 1e7);
  const lakh = Math.floor((whole % 1e7) / 1e5);
  const thousand = Math.floor((whole % 1e5) / 1e3);
  const hundred = whole % 1e3;

  const parts = [
    crore > 0 ? `${threeDigitsToWords(crore)} Crore` : "",
    lakh > 0 ? `${threeDigitsToWords(lakh)} Lakh` : "",
    thousand > 0 ? `${threeDigitsToWords(thousand)} Thousand` : "",
    hundred > 0 ? threeDigitsToWords(hundred) : "",
  ].filter(Boolean);

  return `${parts.join(" ")} Rupees Only`;
}
