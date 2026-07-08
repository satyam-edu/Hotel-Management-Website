import { Phone, Mail, MapPin, MessageCircle, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" style={{ background: "#060F20" }}>
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <span
                className="text-xs tracking-[0.3em] uppercase block mb-1"
                style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
              >
                Hotel
              </span>
              <span
                className="text-2xl"
                style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}
              >
                Kamla Inn Grand
              </span>
            </div>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif" }}
            >
              Luxury hospitality at the heart of Kushinagar. Where every guest is family.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: MessageCircle, label: "WhatsApp" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-80"
                  style={{ border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className="text-xs tracking-[0.2em] uppercase mb-5"
              style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {["About Us", "Rooms & Suites", "Photo Gallery", "Guest Reviews", "Check Availability", "Contact Us"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm transition-all duration-200 hover:text-white"
                    style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif" }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4
              className="text-xs tracking-[0.2em] uppercase mb-5"
              style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
            >
              Our Services
            </h4>
            <ul className="space-y-2.5">
              {["Restaurant & Dining", "Banquet & Events", "Conference Rooms", "Wedding Venue", "Corporate Stay", "Pilgrimage Tours"].map((s) => (
                <li key={s}>
                  <span
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Inter', sans-serif" }}
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-xs tracking-[0.2em] uppercase mb-5"
              style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
            >
              Contact Us
            </h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin size={15} color="#C9A84C" className="shrink-0 mt-0.5" />
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}
                >
                  NH Bypass Road, Padrauna<br />
                  Kushinagar District<br />
                  Uttar Pradesh — 274304
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <Phone size={15} color="#C9A84C" />
                <a
                  href="tel:+919999999999"
                  className="text-sm transition-all duration-200 hover:text-white"
                  style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}
                >
                  +91 99999 99999
                </a>
              </div>
              <div className="flex gap-3 items-center">
                <Mail size={15} color="#C9A84C" />
                <a
                  href="mailto:reservations@kamlainn.com"
                  className="text-sm transition-all duration-200 hover:text-white"
                  style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}
                >
                  reservations@kamlainn.com
                </a>
              </div>
              <div className="flex gap-3 items-center">
                <MessageCircle size={15} color="#C9A84C" />
                <a
                  href="https://wa.me/919999999999"
                  className="text-sm transition-all duration-200 hover:text-white"
                  style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Inter', sans-serif" }}
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif" }}
          >
            © 2025 Hotel Kamla Inn Grand. All rights reserved.
          </p>
          <p
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Inter', sans-serif" }}
          >
            Privacy Policy · Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
}
