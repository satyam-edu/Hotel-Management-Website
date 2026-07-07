import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { useSystemContext } from "../../context/SystemContext";
import { formatTime12h } from "../../lib/date";

const MAPS_URL = "https://maps.app.goo.gl/9e76F5ZfYazrUmAk7";
const MAPS_EMBED_QUERY = encodeURIComponent(
  "Kamala Inn Grand, Padrauna, Kushinagar, UP",
);
const MAPS_COORDINATES = "26.8870394,83.9740667";

export function Footer() {
  const { config } = useSystemContext();

  return (
    <footer id="contact" className="border-t border-white/10 bg-background-dark">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl font-semibold text-primary">
            Kamala Inn Grand
          </h3>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            A landmark of comfort and hospitality on NH-28, Padrauna —
            trusted for weddings, celebrations, and stays that feel like
            home.
          </p>
        </div>

        <div className="space-y-3 text-sm text-white/70">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
            <span>NH-28 Bypass Road, Padrauna, Kushinagar, UP - 274304</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="shrink-0 text-primary" />
            <span>+91 9956050766 / +91 9956050767</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={18} className="shrink-0 text-primary" />
            <span>thekamalainn@gmail.com</span>
          </div>
          <p className="pt-2 text-xs text-white/50">
            Check-in {formatTime12h(config.check_in_time)} &middot; Check-out{" "}
            {formatTime12h(config.check_out_time)}
          </p>
        </div>

        <div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <iframe
              title="Hotel Kamala Inn Grand location"
              src={`https://www.google.com/maps?q=${MAPS_EMBED_QUERY}&ll=${MAPS_COORDINATES}&z=16&output=embed`}
              width="100%"
              height="220"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-light"
          >
            <Navigation size={16} />
            Get Directions
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-5 text-xs text-white/40">
          <p>
            &copy; {new Date().getFullYear()} Hotel Kamala Inn Grand. All
            rights reserved. &middot; GST NO.- 09AAZFK7676F1ZD
          </p>
        </div>
      </div>
    </footer>
  );
}
