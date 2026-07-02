import { useState, type FormEvent } from "react";
import {
  BedDouble,
  Calendar,
  IndianRupee,
  LogIn,
  LogOut,
  Phone,
  User,
} from "lucide-react";
import { PHYSICAL_ROOMS } from "../../data/inventory";

interface BookingFormState {
  guestName: string;
  phone: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
}

const INITIAL_STATE: BookingFormState = {
  guestName: "",
  phone: "",
  roomNumber: PHYSICAL_ROOMS[0].room_number,
  checkIn: "",
  checkOut: "",
  totalAmount: "",
};

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 flex items-center gap-1.5 text-xs tracking-wide text-white/50";

interface DailyGuest {
  id: string;
  guestName: string;
  roomNumber: string;
  nights?: number;
}

const ARRIVALS_TODAY: DailyGuest[] = [
  { id: "arr-1", guestName: "Rohit Malhotra", roomNumber: "203" },
  { id: "arr-2", guestName: "Sunita Devi", roomNumber: "210" },
  { id: "arr-3", guestName: "Amit & Family", roomNumber: "301" },
];

const DEPARTURES_TODAY: DailyGuest[] = [
  { id: "dep-1", guestName: "Vikram Yadav", roomNumber: "205" },
  { id: "dep-2", guestName: "Neha Tripathi", roomNumber: "208" },
];

export function FrontDesk() {
  const [form, setForm] = useState<BookingFormState>(INITIAL_STATE);

  function updateField<K extends keyof BookingFormState>(
    field: K,
    value: BookingFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setForm(INITIAL_STATE);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Front Desk
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Log a confirmed WhatsApp or phone booking directly to the ledger.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-xl p-6 sm:p-8"
        >
          <h2 className="font-display text-xl font-semibold text-white">
            New Booking
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
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
                {PHYSICAL_ROOMS.map((room) => (
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

            <div>
              <label htmlFor="totalAmount" className={labelClasses}>
                <IndianRupee size={14} />
                Total Amount
              </label>
              <input
                id="totalAmount"
                type="number"
                min={0}
                required
                value={form.totalAmount}
                onChange={(e) => updateField("totalAmount", e.target.value)}
                placeholder="0"
                className={inputClasses}
              />
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
          </div>

          <button
            type="submit"
            className="mt-7 w-full rounded-sm bg-primary py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 sm:w-auto sm:px-10"
          >
            Confirm Booking
          </button>
        </form>

        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <LogIn size={16} className="text-emerald-400" />
              Arrivals Today
            </h3>
            <ul className="mt-4 space-y-3">
              {ARRIVALS_TODAY.map((guest) => (
                <li
                  key={guest.id}
                  className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-white/80">
                    {guest.guestName}
                  </span>
                  <span className="text-xs text-white/40">
                    Room {guest.roomNumber}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
              <LogOut size={16} className="text-amber-400" />
              Departures Today
            </h3>
            <ul className="mt-4 space-y-3">
              {DEPARTURES_TODAY.map((guest) => (
                <li
                  key={guest.id}
                  className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm text-white/80">
                    {guest.guestName}
                  </span>
                  <span className="text-xs text-white/40">
                    Room {guest.roomNumber}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
