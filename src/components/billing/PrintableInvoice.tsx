import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { amountInWords, countNights, formatCurrency } from "../../lib/billing";
import { supabase } from "../../lib/supabase";
import { useSystemContext } from "../../context/SystemContext";
import type { Reservation } from "../../types/database";
import kamalaLogo from "../../assets/logo.png";

const PROPERTY_NAME = "KAMALA INN GRAND HOTEL";
const PROPERTY_ADDRESS_LINE_1 = "Sohrauna, Kasya Road, Padrauna,";
const PROPERTY_ADDRESS_LINE_2 = "Kushinagar, Uttar Pradesh 274304";
const PROPERTY_PHONE_1 = "+91 9956050766";
const PROPERTY_PHONE_2 = "+91 9956050767";
const PROPERTY_EMAIL = "thekamalainn@gmail.com";
const PROPERTY_GSTIN = "09AAZFK7676F1ZD";

// The paper hotel register this invoice mirrors tracks several fields (Reg
// No, Meal Plan, Company/Nationality/Pax name+age, per-room "Other Room"/
// "Other Tariff", and a settlement/receipt ledger) that the Reservation
// schema does not capture today — it only has guest_name, room_number,
// dates, adults/children counts, and a single running amount_paid scalar.
// Rather than block this printable layout on a schema migration, those
// fields render as blank, editable text inputs the front desk fills in per
// booking; nothing here is persisted to the database.
//
// Bill No. and client GSTIN are the two exceptions — Bill No. is backed by
// reservations.bill_sequence (0033_reservation_bill_sequence.sql), a real
// auto-incrementing integer formatted as a single uppercase prefix letter +
// 5-digit zero-padded sequence (D00216). GSTIN is backed by
// reservations.guest_gstin (0034_reservation_guest_gstin.sql), editable in
// Edit Ledger and persisted so it shows up consistently on every future
// print of the same booking — the field here still allows a one-off inline
// edit for this print only, same as the other manual fields, but starts
// pre-filled from the real column instead of always blank.
function formatBillNo(billSequence: number): string {
  return `D${String(billSequence).padStart(5, "0")}`;
}

// Mirrors formatBillNo's convention (letter prefix + 5-digit zero-padded
// sequence, e.g. T00278) but with a "T" prefix for the settlement/receipt
// row. There's no separate per-transaction table this could be sourced
// from — reservations.amount_paid is a single running total, not itemized
// payments — so this derives from the same real bill_sequence rather than
// inventing an unrelated random id.
function formatReceiptNo(billSequence: number): string {
  return `T${String(billSequence).padStart(5, "0")}`;
}

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

const fieldInputClasses =
  "flex-1 border-none bg-transparent px-1 py-0 text-xs text-slate-900 outline-none print:text-black";

const cellInputClasses =
  "w-full bg-transparent px-1 py-1 text-right text-xs text-slate-900 outline-none";

interface ManualFields {
  billNo: string;
  name: string;
  companyName: string;
  regNo: string;
  nationality: string;
  otherRoom: string;
  address: string;
  paxName: string;
  paxNationality: string;
  age: string;
  mealPlan: string;
  arrDate: string;
  arrTime: string;
  tariff: string;
  discountPercent: string;
  depDate: string;
  depTime: string;
  modeOfPayment: string;
  otherTariff: string;
  clientGstin: string;
  allowance: string;
}

interface ChargeRow {
  date: string;
  roomRent: string;
  extraBed: string;
  laundry: string;
  food: string;
  misc: string;
}

interface SettlementRow {
  receiptNo: string;
  recDate: string;
  settlementMode: string;
  amount: string;
}

function blankChargeRow(): ChargeRow {
  return { date: "", roomRent: "", extraBed: "", laundry: "", food: "", misc: "" };
}

function blankSettlementRow(): SettlementRow {
  return { receiptNo: "", recDate: "", settlementMode: "", amount: "" };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface InvoiceDocumentProps {
  reservation: Reservation;
  config: { tax_rate: number };
}

function InvoiceDocument({ reservation, config }: InvoiceDocumentProps) {
  const nights = countNights(reservation.check_in_date, reservation.check_out_date);
  const subtotal = Math.max(
    reservation.total_amount - reservation.tax_amount + reservation.discount_amount,
    0,
  );
  const halfTaxRate = config.tax_rate / 2;
  const cgst = reservation.tax_amount / 2;
  const sgst = reservation.tax_amount / 2;
  const balance = Math.max(reservation.total_amount - reservation.amount_paid, 0);

  const [fields, setFields] = useState<ManualFields>({
    billNo: formatBillNo(reservation.bill_sequence),
    name: reservation.guest_name ?? "",
    companyName: "",
    regNo: "",
    nationality: "",
    otherRoom: "",
    address: "",
    paxName: "",
    paxNationality: "",
    age: "",
    mealPlan: "",
    arrDate: formatDate(reservation.check_in_date),
    arrTime: "",
    tariff: nights > 0 ? (subtotal / nights).toFixed(2) : subtotal.toFixed(2),
    discountPercent: "",
    depDate: formatDate(reservation.check_out_date),
    depTime: "",
    modeOfPayment: "",
    otherTariff: "",
    clientGstin: reservation.guest_gstin,
    allowance: "0",
  });

  const [chargeRows, setChargeRows] = useState<ChargeRow[]>(() => [
    {
      date: formatDate(reservation.check_in_date),
      roomRent: subtotal.toFixed(2),
      extraBed: "",
      laundry: "",
      food: "",
      misc: "",
    },
  ]);

  const [settlementRows, setSettlementRows] = useState<SettlementRow[]>(() =>
    reservation.amount_paid > 0
      ? [
          {
            receiptNo: formatReceiptNo(reservation.bill_sequence),
            recDate: formatDate(reservation.check_in_date),
            settlementMode: "",
            amount: reservation.amount_paid.toFixed(2),
          },
        ]
      : [blankSettlementRow()],
  );

  const allowanceAmount = toNumber(fields.allowance);
  const netPayable = Math.max(reservation.total_amount - allowanceAmount, 0);

  const columnTotals = chargeRows.reduce(
    (acc, row) => ({
      roomRent: acc.roomRent + toNumber(row.roomRent),
      extraBed: acc.extraBed + toNumber(row.extraBed),
      laundry: acc.laundry + toNumber(row.laundry),
      food: acc.food + toNumber(row.food),
      misc: acc.misc + toNumber(row.misc),
    }),
    { roomRent: 0, extraBed: 0, laundry: 0, food: 0, misc: 0 },
  );
  const grandTotal =
    columnTotals.roomRent +
    columnTotals.extraBed +
    columnTotals.laundry +
    columnTotals.food +
    columnTotals.misc;

  const settlementTotal = settlementRows.reduce((sum, row) => sum + toNumber(row.amount), 0);

  function updateField<K extends keyof ManualFields>(field: K, value: ManualFields[K]) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  function updateChargeRow<K extends keyof ChargeRow>(index: number, field: K, value: ChargeRow[K]) {
    setChargeRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function addChargeRow() {
    setChargeRows((prev) => [...prev, blankChargeRow()]);
  }

  function updateSettlementRow<K extends keyof SettlementRow>(
    index: number,
    field: K,
    value: SettlementRow[K],
  ) {
    setSettlementRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function addSettlementRow() {
    setSettlementRows((prev) => [...prev, blankSettlementRow()]);
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-slate-200 p-4 print:block print:min-h-0 print:bg-white print:p-0">
      <div className="print-invoice mx-auto w-full max-w-4xl rounded-xl bg-white p-6 text-slate-900 sm:p-8 print:max-w-none print:rounded-none print:p-0 print:text-black print:shadow-none">
        <button
          type="button"
          onClick={() => window.print()}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-sm bg-slate-900 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity duration-300 hover:opacity-90 print:hidden"
        >
          <Printer size={14} />
          Print / Save as PDF
        </button>

        {/* Header */}
        <div className="relative pb-3 text-center">
          <img
            src={kamalaLogo}
            alt=""
            className="absolute left-0 top-0 h-16 w-auto object-contain"
          />
          <h1 className="text-3xl font-extrabold uppercase tracking-wide text-slate-900 print:text-black">
            {PROPERTY_NAME}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-slate-700 print:text-black">
            {PROPERTY_ADDRESS_LINE_1}
          </p>
          <p className="text-sm font-semibold text-slate-700 print:text-black">
            {PROPERTY_ADDRESS_LINE_2}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700 print:text-black">
            Mobile: {PROPERTY_PHONE_1}, {PROPERTY_PHONE_2}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-700 print:text-black">
            Email: {PROPERTY_EMAIL}
          </p>
          <p className="text-sm font-semibold text-slate-700 print:text-black">
            GST No. {PROPERTY_GSTIN}
          </p>
        </div>

        {/* Meta info grid — two borderless columns, colon-aligned */}
        <div className="mt-4 grid grid-cols-1 gap-x-8 border-t border-slate-800 pt-3 sm:grid-cols-2 break-inside-avoid">
          <div className="space-y-1">
            <MetaField label="Bill No." value={fields.billNo} onChange={(v) => updateField("billNo", v)} />
            <MetaField label="Name" value={fields.name} onChange={(v) => updateField("name", v)} />
            <MetaField label="Company" value={fields.companyName} onChange={(v) => updateField("companyName", v)} />
            <MetaField label="Room No." value={reservation.room_number ?? ""} readOnly />
            <MetaField label="Age" value={fields.age} onChange={(v) => updateField("age", v)} />
            <MetaField
              label="Pax"
              value={`Adult- ${reservation.adults} / ${reservation.children}`}
              readOnly
            />
            <MetaField label="Reg. No." value={fields.regNo} onChange={(v) => updateField("regNo", v)} />
            <MetaField label="Nationality" value={fields.nationality} onChange={(v) => updateField("nationality", v)} />
            <MetaField label="Other Room" value={fields.otherRoom} onChange={(v) => updateField("otherRoom", v)} />
            <MetaField label="Address" value={fields.address} onChange={(v) => updateField("address", v)} />
            <MetaField label="Pax Name" value={fields.paxName} onChange={(v) => updateField("paxName", v)} />
            <MetaField label="Pax Nationality" value={fields.paxNationality} onChange={(v) => updateField("paxNationality", v)} />
          </div>
          <div className="space-y-1">
            <MetaField label="Meal Plan" value={fields.mealPlan} onChange={(v) => updateField("mealPlan", v)} />
            <MetaField label="Arr. Date" value={fields.arrDate} onChange={(v) => updateField("arrDate", v)} />
            <MetaField label="Arr. Time" value={fields.arrTime} onChange={(v) => updateField("arrTime", v)} />
            <MetaField label="Tariff" value={fields.tariff} onChange={(v) => updateField("tariff", v)} />
            <MetaField label="Discount" value={fields.discountPercent} onChange={(v) => updateField("discountPercent", v)} suffix="%" />
            <MetaField label="Dep. Date" value={fields.depDate} onChange={(v) => updateField("depDate", v)} />
            <MetaField label="Dep. Time" value={fields.depTime} onChange={(v) => updateField("depTime", v)} />
            <MetaField label="Mode of Payment" value={fields.modeOfPayment} onChange={(v) => updateField("modeOfPayment", v)} />
            <div className="h-2" />
            <MetaField label="Other Tariff" value={fields.otherTariff} onChange={(v) => updateField("otherTariff", v)} />
            <MetaField label="GSTIN No." value={fields.clientGstin} onChange={(v) => updateField("clientGstin", v)} />
          </div>
        </div>

        {/* Itemized charges table */}
        <div className="mt-4 break-inside-avoid">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-left align-top">
                <Th align="left">Date</Th>
                <Th>Room Rent<br /><span className="font-normal normal-case">HSN/SAC 996331</span></Th>
                <Th>Extra Bed<br /><span className="font-normal normal-case">HSN/SAC</span></Th>
                <Th>Loundary<br /><span className="font-normal normal-case">HSN/SAC</span></Th>
                <Th>Food<br /><span className="font-normal normal-case">HSN/SAC 996331</span></Th>
                <Th>Misc<br /><span className="font-normal normal-case">HSN/SAC</span></Th>
                <Th>Total</Th>
                <Th>Grand Total</Th>
              </tr>
            </thead>
            <tbody>
              {chargeRows.map((row, index) => {
                const rowTotal =
                  toNumber(row.roomRent) +
                  toNumber(row.extraBed) +
                  toNumber(row.laundry) +
                  toNumber(row.food) +
                  toNumber(row.misc);
                return (
                  <tr key={index} className="border-b border-dotted border-slate-400">
                    <Td align="left">
                      <input
                        type="text"
                        value={row.date}
                        onChange={(e) => updateChargeRow(index, "date", e.target.value)}
                        className={`${cellInputClasses} text-left`}
                      />
                    </Td>
                    {(["roomRent", "extraBed", "laundry", "food", "misc"] as const).map((col) => (
                      <Td key={col}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row[col]}
                          onChange={(e) => updateChargeRow(index, col, e.target.value)}
                          className={cellInputClasses}
                          placeholder="0.00"
                        />
                      </Td>
                    ))}
                    <Td className="font-medium">{rowTotal.toFixed(2)}</Td>
                    <Td className="font-medium">
                      {index === chargeRows.length - 1 ? grandTotal.toFixed(2) : ""}
                    </Td>
                  </tr>
                );
              })}
              <tr className="border-b border-slate-800 font-semibold">
                <Td align="left">Total :</Td>
                <Td>{columnTotals.roomRent.toFixed(2)}</Td>
                <Td>{columnTotals.extraBed.toFixed(2)}</Td>
                <Td>{columnTotals.laundry.toFixed(2)}</Td>
                <Td>{columnTotals.food.toFixed(2)}</Td>
                <Td>{columnTotals.misc.toFixed(2)}</Td>
                <Td>{grandTotal.toFixed(2)}</Td>
                <Td></Td>
              </tr>
            </tbody>
          </table>
          <button
            type="button"
            onClick={addChargeRow}
            className="mt-2 text-[11px] font-medium text-primary underline print:hidden"
          >
            + Add row
          </button>
        </div>

        {/* Tax & summary block, right-aligned, amount-in-words bottom-left */}
        <div className="mt-4 flex items-start justify-between gap-6 break-inside-avoid">
          <p className="mt-auto pt-6 text-sm font-bold italic text-slate-900 print:text-black">
            {amountInWords(balance).toUpperCase()}
          </p>
          <div className="w-full max-w-xs space-y-1 text-xs">
            <SummaryLine label="Sub Total" value={formatCurrency(subtotal)} />
            <SummaryLine label="Discount Amount" value={reservation.discount_amount > 0 ? formatCurrency(reservation.discount_amount) : ""} />
            <SummaryLine label="Sub Total" value={formatCurrency(subtotal - reservation.discount_amount)} />
            <SummaryLine label={`CGST${halfTaxRate.toFixed(1)}%`} value={formatCurrency(cgst)} />
            <SummaryLine label={`SGST${halfTaxRate.toFixed(1)}%`} value={formatCurrency(sgst)} />
            <SummaryLine label="Total" value={formatCurrency(reservation.total_amount)} bold />
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600 print:text-black">Allowance</span>
              <span className="flex items-center gap-1">
                <span>:</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fields.allowance}
                  onChange={(e) => updateField("allowance", e.target.value)}
                  className="w-24 bg-transparent text-right outline-none"
                />
              </span>
            </div>
            <SummaryLine label="Net Payble" value={formatCurrency(netPayable)} bold />
            <SummaryLine label="Currently Settled" value={formatCurrency(reservation.amount_paid)} />
            <div className="pt-2">
              <SummaryLine label="Balance" value={formatCurrency(balance)} bold large />
            </div>
          </div>
        </div>

        {/* Receipt / settlement table */}
        <div className="mt-6 border-t border-slate-800 pt-3 break-inside-avoid">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <Th align="left">Receipt No</Th>
                <Th align="left">Rec.Date</Th>
                <Th align="left">Settlement Mode</Th>
                <Th align="left">Amt.</Th>
              </tr>
            </thead>
            <tbody>
              {settlementRows.map((row, index) => (
                <tr key={index} className="border-b border-dotted border-slate-400">
                  <Td align="left">
                    <input
                      type="text"
                      value={row.receiptNo}
                      onChange={(e) => updateSettlementRow(index, "receiptNo", e.target.value)}
                      className={`${cellInputClasses} text-left`}
                    />
                  </Td>
                  <Td align="left">
                    <input
                      type="text"
                      value={row.recDate}
                      onChange={(e) => updateSettlementRow(index, "recDate", e.target.value)}
                      className={`${cellInputClasses} text-left`}
                    />
                  </Td>
                  <Td align="left">
                    <input
                      type="text"
                      value={row.settlementMode}
                      onChange={(e) => updateSettlementRow(index, "settlementMode", e.target.value)}
                      className={`${cellInputClasses} text-left`}
                    />
                  </Td>
                  <Td align="left">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(e) => updateSettlementRow(index, "amount", e.target.value)}
                      className={`${cellInputClasses} text-left`}
                      placeholder="0.00"
                    />
                  </Td>
                </tr>
              ))}
              <tr className="border-b border-slate-800">
                <Td align="left"></Td>
                <Td align="left"></Td>
                <Td align="left" className="text-right font-semibold">
                  Total Amount==&gt;
                </Td>
                <Td align="left" className="font-semibold">
                  {settlementTotal.toFixed(2)}
                </Td>
              </tr>
            </tbody>
          </table>
          <button
            type="button"
            onClick={addSettlementRow}
            className="mt-2 text-[11px] font-medium text-primary underline print:hidden"
          >
            + Add row
          </button>
        </div>

        {/* Footer signatures */}
        <div className="mt-16 flex items-end justify-between break-inside-avoid">
          <p className="text-xs italic text-slate-800 print:text-black">
            (Signature of Guest)
          </p>
          <p className="text-xs italic text-slate-800 print:text-black">
            (F.O. Signature)
          </p>
        </div>
      </div>
    </div>
  );
}

// Standalone, routed page — opened via window.open(..., "_blank") from the
// Ledger's "Generate GST Invoice"/"Generate Receipt" actions so print
// preview happens in its own tab, fully separate from the admin dashboard
// (no sidebar/nav to hide, no reliance on the .print-invoice global CSS
// rule stripping surrounding chrome). Supabase persists the session in
// localStorage, so the new tab is authenticated the same as the tab it was
// opened from — no data needs to be passed via window.open, just the
// reservation id in the URL.
export function PrintableInvoice() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const { config, isLoading: isConfigLoading } = useSystemContext();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId || !supabase) {
      setLoadError("This invoice link is invalid.");
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    supabase
      .from("reservations")
      .select("*")
      .eq("id", reservationId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (isCancelled) return;
        if (error || !data) {
          setLoadError("Could not find this booking.");
        } else {
          setReservation(data);
        }
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [reservationId]);

  if (isLoading || isConfigLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-200 text-sm text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        Loading invoice…
      </div>
    );
  }

  if (loadError || !reservation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-200 p-6 text-center text-sm text-red-600">
        {loadError ?? "Could not find this booking."}
      </div>
    );
  }

  return <InvoiceDocument reservation={reservation} config={config} />;
}

function MetaField({
  label,
  value,
  onChange,
  readOnly,
  suffix,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  suffix?: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5 text-xs">
      <span className="w-28 shrink-0 font-bold text-slate-900 print:text-black">{label}</span>
      <span className="text-slate-500">:</span>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={fieldInputClasses}
      />
      {suffix && <span className="shrink-0 text-slate-500">{suffix}</span>}
    </div>
  );
}

function SummaryLine({
  label,
  value,
  bold,
  large,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        bold ? "font-bold text-slate-900 print:text-black" : "text-slate-700 print:text-black"
      } ${large ? "text-sm" : ""}`}
    >
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span>:</span>
        <span>{value}</span>
      </span>
    </div>
  );
}

function Th({ children, align = "center" }: { children: React.ReactNode; align?: "left" | "center" }) {
  return (
    <th
      className={`px-1.5 py-1 font-bold uppercase text-slate-900 print:text-black ${
        align === "left" ? "text-left" : "text-center"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  align = "center",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <td className={`px-1.5 py-1 ${align === "left" ? "text-left" : "text-center"} ${className}`}>
      {children}
    </td>
  );
}
