import { useState, type FormEvent } from "react";

const WHATSAPP_NUMBER = "910000000000";

const DUMMY_ROOM_TYPES = ["Deluxe Room", "Executive Suite", "Family Room"] as const;

interface BookingFormState {
  fullName: string;
  mobile: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  adults: number;
  children: number;
}

const INITIAL_STATE: BookingFormState = {
  fullName: "",
  mobile: "",
  checkIn: "",
  checkOut: "",
  roomType: DUMMY_ROOM_TYPES[0],
  adults: 1,
  children: 0,
};

const inputClasses =
  "w-full rounded-lg border border-white/15 bg-background-dark/60 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const labelClasses = "mb-1.5 block text-sm font-medium text-white/80";

export function BookingFormSection() {
  const [form, setForm] = useState<BookingFormState>(INITIAL_STATE);

  function updateField<K extends keyof BookingFormState>(
    field: K,
    value: BookingFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = `Hello, I would like to enquire about a booking.
Name: ${form.fullName}
Mobile: ${form.mobile}
Check-in: ${form.checkIn}
Check-out: ${form.checkOut}
Room Type: ${form.roomType}
Adults: ${form.adults}
Children: ${form.children}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
      "_blank",
    );
  }

  return (
    <section id="booking" className="mx-auto max-w-4xl px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Check Availability
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Request a Booking
        </h2>
        <p className="mt-4 text-base leading-relaxed text-white/70">
          Share your travel details and we&apos;ll confirm availability with
          you directly over WhatsApp.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel mt-12 grid gap-5 rounded-2xl p-6 sm:grid-cols-2 sm:p-10"
      >
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
            placeholder="Your name"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="mobile" className={labelClasses}>
            Mobile Number
          </label>
          <input
            id="mobile"
            type="tel"
            required
            pattern="[0-9]{10}"
            value={form.mobile}
            onChange={(e) => updateField("mobile", e.target.value)}
            placeholder="10-digit mobile number"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="checkIn" className={labelClasses}>
            Check-in Date
          </label>
          <input
            id="checkIn"
            type="date"
            required
            min={new Date().toISOString().split("T")[0]}
            value={form.checkIn}
            onChange={(e) => updateField("checkIn", e.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="checkOut" className={labelClasses}>
            Check-out Date
          </label>
          <input
            id="checkOut"
            type="date"
            required
            min={form.checkIn || new Date().toISOString().split("T")[0]}
            value={form.checkOut}
            onChange={(e) => updateField("checkOut", e.target.value)}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="roomType" className={labelClasses}>
            Room Type
          </label>
          <select
            id="roomType"
            value={form.roomType}
            onChange={(e) => updateField("roomType", e.target.value)}
            className={inputClasses}
          >
            {DUMMY_ROOM_TYPES.map((room) => (
              <option key={room} value={room} className="bg-background-dark">
                {room}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label htmlFor="adults" className={labelClasses}>
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

        <button
          type="submit"
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-background-dark transition-transform hover:scale-[1.01] sm:col-span-2"
        >
          Send Enquiry on WhatsApp
        </button>
      </form>
    </section>
  );
}
