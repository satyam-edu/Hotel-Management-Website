import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { BriefcaseBusiness, Calendar, CheckCircle2, Users } from "lucide-react";
import { todayIsoDate } from "../../lib/date";
import { generateEnquiryReference } from "../../lib/enquiries";
import { loadRoomCategories } from "../../lib/rooms";
import { supabase } from "../../lib/supabase";
import type { RoomCategory } from "../../types/database";

const WHATSAPP_NUMBER = "919956050766";
const GST_RATE = 0.12;

const CANCELLATION_POLICY = [
  "Free cancellation up to 48 hours before check-in",
  "50% charge for cancellations within 24–48 hours",
  "No refund for cancellations within 24 hours",
  "No-show treated as full stay charge",
];

interface BookingFormState {
  fullName: string;
  mobile: string;
  email: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomTypeId: string;
  specialRequests: string;
}

const todayIso = todayIsoDate();

const INITIAL_STATE: BookingFormState = {
  fullName: "",
  mobile: "",
  email: "",
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  roomTypeId: "",
  specialRequests: "",
};

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

function countNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return nights > 0 ? nights : 0;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

interface BookingFormSectionProps {
  selectedRoomId: string | null;
}

export function BookingFormSection({ selectedRoomId }: BookingFormSectionProps) {
  const [form, setForm] = useState<BookingFormState>(INITIAL_STATE);
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedReference, setConfirmedReference] = useState<string | null>(
    null,
  );

  const initialSelectedRoomId = useRef(selectedRoomId);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await loadRoomCategories({ sellableOnly: true });
      setRoomCategories(data);
      if (data.length > 0) {
        const initialId = initialSelectedRoomId.current;
        const preferredId =
          initialId && data.some((r) => r.id === initialId)
            ? initialId
            : data[0].id;
        setForm((prev) =>
          prev.roomTypeId ? prev : { ...prev, roomTypeId: preferredId },
        );
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedRoomId && roomCategories.some((r) => r.id === selectedRoomId)) {
      setForm((prev) => ({ ...prev, roomTypeId: selectedRoomId }));
    }
  }, [selectedRoomId, roomCategories]);

  function updateField<K extends keyof BookingFormState>(
    field: K,
    value: BookingFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedRoom = useMemo(
    () => roomCategories.find((room) => room.id === form.roomTypeId) ?? null,
    [roomCategories, form.roomTypeId],
  );

  const nights = countNights(form.checkIn, form.checkOut);
  const subtotal = (selectedRoom?.nightly_rate ?? 0) * nights;
  const gstAmount = subtotal * GST_RATE;
  const totalEstimate = subtotal + gstAmount;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setSubmitError("Could not submit your enquiry. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const referenceCode = generateEnquiryReference();

    const { error } = await supabase.from("enquiries").insert({
      reference_code: referenceCode,
      full_name: form.fullName,
      mobile: form.mobile,
      email: form.email,
      check_in_date: form.checkIn,
      check_out_date: form.checkOut,
      adults: form.adults,
      children: form.children,
      room_type_id: form.roomTypeId || null,
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Failed to submit enquiry:", error.message);
      setSubmitError(
        "Your enquiry could not be submitted. Please try again — your details have been kept.",
      );
      return;
    }

    setConfirmedReference(referenceCode);

    const message = `Hello, I would like to enquire about a booking.
Reference: ${referenceCode}
Name: ${form.fullName}
Mobile: ${form.mobile}
Email: ${form.email}
Check-in: ${form.checkIn}
Check-out: ${form.checkOut}
Guests: ${form.adults} Adults, ${form.children} Children
Room Type: ${selectedRoom?.name ?? "Not specified"}
Special Requests: ${form.specialRequests || "None"}
Estimated Total: ${formatCurrency(totalEstimate)}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
      "_blank",
    );
  }

  return (
    <section id="booking" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          Reserve Your Stay
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Check Availability
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div className="glass-panel rounded-xl p-6 sm:p-8">
            <h3 className="font-display flex items-center gap-2 text-xl font-semibold text-white">
              <BriefcaseBusiness size={20} className="text-primary" />
              Guest Details
            </h3>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className={labelClasses}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Your full name"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="mobile" className={labelClasses}>
                  Phone Number
                </label>
                <input
                  id="mobile"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={form.mobile}
                  onChange={(e) => updateField("mobile", e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputClasses}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="email" className={labelClasses}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@example.com"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 sm:p-8">
            <h3 className="font-display flex items-center gap-2 text-xl font-semibold text-white">
              <Calendar size={20} className="text-primary" />
              Booking Details
            </h3>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="checkIn" className={labelClasses}>
                  Check-In Date
                </label>
                <input
                  id="checkIn"
                  type="date"
                  required
                  min={todayIso}
                  value={form.checkIn}
                  onChange={(e) => updateField("checkIn", e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="checkOut" className={labelClasses}>
                  Check-Out Date
                </label>
                <input
                  id="checkOut"
                  type="date"
                  required
                  min={form.checkIn || todayIso}
                  value={form.checkOut}
                  onChange={(e) => updateField("checkOut", e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="adults" className={`${labelClasses} flex items-center gap-1.5`}>
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
                <label htmlFor="roomType" className={labelClasses}>
                  Room Type
                </label>
                <select
                  id="roomType"
                  value={form.roomTypeId}
                  onChange={(e) => updateField("roomTypeId", e.target.value)}
                  className={inputClasses}
                >
                  {roomCategories.map((room) => (
                    <option key={room.id} value={room.id} className="bg-background-dark">
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="specialRequests" className={labelClasses}>
                  Special Requests (optional)
                </label>
                <textarea
                  id="specialRequests"
                  rows={3}
                  value={form.specialRequests}
                  onChange={(e) => updateField("specialRequests", e.target.value)}
                  placeholder="e.g., early check-in, extra bed, anniversary decoration..."
                  className={`${inputClasses} resize-none`}
                />
              </div>
            </div>
          </div>

          {confirmedReference ? (
            <div
              className="flex items-start gap-3 rounded-sm border border-emerald-400/25 bg-emerald-400/10 p-5 text-sm text-emerald-300"
              role="status"
            >
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <p>
                Enquiry received, reference:{" "}
                <span className="font-mono font-semibold">
                  {confirmedReference}
                </span>
                . Our front desk will be in touch with you shortly.
              </p>
            </div>
          ) : (
            <>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-sm bg-primary py-4 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Submitting…" : "Submit Booking Enquiry"}
              </button>

              {submitError && (
                <p className="text-sm text-red-400" role="alert">
                  {submitError}
                </p>
              )}
            </>
          )}
        </div>

        <aside
          className="h-fit rounded-xl p-6 sm:sticky sm:top-24 sm:p-8"
          style={{
            background: "rgba(var(--color-primary-rgb), 0.08)",
            border: "1px solid rgba(var(--color-primary-rgb), 0.25)",
          }}
        >
          <h3 className="font-display flex items-center gap-2 text-xl font-semibold text-white">
            <span aria-hidden="true" className="text-primary">
              &#9635;
            </span>
            Cost Estimator
          </h3>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-white/60">Room</dt>
              <dd className="font-medium text-white">
                {selectedRoom?.name ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-white/60">Rate / night</dt>
              <dd className="font-medium text-primary">
                {formatCurrency(selectedRoom?.nightly_rate ?? 0)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-white/60">Nights</dt>
              <dd className="font-medium text-white">{nights}</dd>
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <dt className="text-white/60">Subtotal</dt>
                <dd className="font-medium text-white">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <dt className="text-white/60">GST (12%)</dt>
                <dd className="font-medium text-white">{formatCurrency(gstAmount)}</dd>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <dt className="text-base font-semibold text-white">Total Estimate</dt>
              <dd className="font-display text-xl font-semibold text-primary">
                {formatCurrency(totalEstimate)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-white/40">
            * This is an estimate. Final pricing confirmed upon booking. GST
            &amp; charges may vary.
          </p>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Cancellation Policy
            </p>
            <ul className="mt-3 space-y-1.5">
              {CANCELLATION_POLICY.map((rule) => (
                <li key={rule} className="text-xs leading-relaxed text-white/60">
                  &bull; {rule}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </form>
    </section>
  );
}
