import { useState } from "react";
import { Calendar, Users, BedDouble, Calculator, CheckCircle } from "lucide-react";

const roomTypes = [
  { id: "standard", label: "Standard Room", price: 1799 },
  { id: "deluxe", label: "Deluxe Room", price: 2499 },
  { id: "super-deluxe", label: "Super Deluxe Room", price: 3499 },
  { id: "suite", label: "Executive Suite", price: 5499 },
  { id: "family", label: "Family Suite", price: 4499 },
];

const GST_RATE = 0.12;

function diffNights(checkin: string, checkout: string) {
  if (!checkin || !checkout) return 0;
  const d = (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000;
  return d > 0 ? d : 0;
}

export function Booking({ preselectedRoom }: { preselectedRoom?: string }) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    checkin: today,
    checkout: tomorrow,
    guests: "2",
    roomType: preselectedRoom || "deluxe",
    specialRequest: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectedRoom = roomTypes.find((r) => r.id === form.roomType) || roomTypes[0];
  const nights = diffNights(form.checkin, form.checkout);
  const baseAmount = selectedRoom.price * nights;
  const gstAmount = Math.round(baseAmount * GST_RATE);
  const totalAmount = baseAmount + gstAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="booking" className="w-full py-20 lg:py-28" style={{ background: "#091628" }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(34,197,94,0.15)" }}
          >
            <CheckCircle size={32} color="#22c55e" />
          </div>
          <h2
            className="mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.8rem" }}
          >
            Enquiry Received!
          </h2>
          <p
            className="mb-6"
            style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif" }}
          >
            Thank you, <strong style={{ color: "#C9A84C" }}>{form.name}</strong>. Our reservations team will
            contact you at {form.phone} within 2 hours to confirm your booking.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-3 rounded text-sm tracking-wide"
            style={{ background: "#C9A84C", color: "#0F1E3C", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
          >
            Make Another Enquiry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="w-full py-20 lg:py-28" style={{ background: "#091628" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
          >
            Reserve Your Stay
          </span>
          <h2
            className="mt-3"
            style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}
          >
            Check Availability
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
            <div
              className="rounded-xl p-6"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h3
                className="mb-5 flex items-center gap-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.1rem" }}
              >
                <BedDouble size={18} color="#C9A84C" /> Guest Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", type: "text", placeholder: "Your full name" },
                  { label: "Phone Number", key: "phone", type: "tel", placeholder: "+91 98765 43210" },
                  { label: "Email Address", key: "email", type: "email", placeholder: "you@example.com" },
                ].map((field) => (
                  <div key={field.key} className={field.key === "email" ? "sm:col-span-2" : ""}>
                    <label
                      className="block text-xs mb-1.5 tracking-wide"
                      style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      required
                      className="w-full px-4 py-2.5 rounded outline-none text-sm"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-6"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h3
                className="mb-5 flex items-center gap-2"
                style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.1rem" }}
              >
                <Calendar size={18} color="#C9A84C" /> Booking Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    value={form.checkin}
                    min={today}
                    onChange={(e) => set("checkin", e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded outline-none text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Inter', sans-serif", colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={form.checkout}
                    min={form.checkin || today}
                    onChange={(e) => set("checkout", e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded outline-none text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Inter', sans-serif", colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>
                    <Users size={12} className="inline mr-1" /> Number of Guests
                  </label>
                  <select
                    value={form.guests}
                    onChange={(e) => set("guests", e.target.value)}
                    className="w-full px-4 py-2.5 rounded outline-none text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Inter', sans-serif", colorScheme: "dark" }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>
                    Room Type
                  </label>
                  <select
                    value={form.roomType}
                    onChange={(e) => set("roomType", e.target.value)}
                    className="w-full px-4 py-2.5 rounded outline-none text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Inter', sans-serif", colorScheme: "dark" }}
                  >
                    {roomTypes.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs mb-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>
                    Special Requests (optional)
                  </label>
                  <textarea
                    value={form.specialRequest}
                    onChange={(e) => set("specialRequest", e.target.value)}
                    rows={3}
                    placeholder="e.g., early check-in, extra bed, anniversary decoration..."
                    className="w-full px-4 py-2.5 rounded outline-none text-sm resize-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded tracking-wider uppercase transition-all duration-200 hover:opacity-90"
              style={{ background: "#C9A84C", color: "#0F1E3C", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.15em" }}
            >
              Submit Booking Enquiry
            </button>
          </form>

          {/* Intelligent Room Calculator */}
          <div>
            <div
              className="rounded-xl p-6 sticky top-24"
              style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}
            >
              <h3
                className="flex items-center gap-2 mb-5"
                style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1rem" }}
              >
                <Calculator size={16} color="#C9A84C" /> Cost Estimator
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}>Room</span>
                  <span style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>{selectedRoom.label}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}>Rate / night</span>
                  <span style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>₹{selectedRoom.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}>Nights</span>
                  <span style={{ color: "#fff", fontFamily: "'Inter', sans-serif" }}>{nights}</span>
                </div>
                <div
                  className="border-t pt-3 mt-3"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}>Subtotal</span>
                    <span style={{ color: "#fff", fontFamily: "'Inter', sans-serif" }}>₹{baseAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}>GST (12%)</span>
                    <span style={{ color: "#fff", fontFamily: "'Inter', sans-serif" }}>₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div
                  className="border-t pt-3 mt-3"
                  style={{ borderColor: "rgba(201,168,76,0.3)" }}
                >
                  <div className="flex justify-between items-center">
                    <span
                      style={{ color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                    >
                      Total Estimate
                    </span>
                    <span
                      style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif", fontSize: "1.3rem" }}
                    >
                      {nights > 0 ? `₹${totalAmount.toLocaleString("en-IN")}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
              <p
                className="text-xs mt-4 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Inter', sans-serif" }}
              >
                * This is an estimate. Final pricing confirmed upon booking. GST & charges may vary.
              </p>

              {/* Cancellation Policy */}
              <div
                className="mt-5 pt-5 border-t"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <p
                  className="text-xs mb-2 uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}
                >
                  Cancellation Policy
                </p>
                <ul className="text-xs space-y-1.5" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}>
                  <li>• Free cancellation up to 48 hours before check-in</li>
                  <li>• 50% charge for cancellations within 24–48 hours</li>
                  <li>• No refund for cancellations within 24 hours</li>
                  <li>• No-show treated as full stay charge</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
