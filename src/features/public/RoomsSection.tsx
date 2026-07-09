import { useEffect, useState } from "react";
import {
  Bath,
  Car,
  Coffee,
  Sparkles,
  Tv,
  Wifi,
  Wind,
  type LucideIcon,
} from "lucide-react";
import heroFallback from "../../assets/hero.png";
import { loadRoomCategories } from "../../lib/rooms";
import { supabase } from "../../lib/supabase";
import { useSiteContent } from "../../context/SiteContentContext";
import type { RoomCategory } from "../../types/database";

interface RoomsSectionProps {
  onSelectRoom: (roomId: string) => void;
}

function parseAmenities(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Amenities are free-text (admin-typed), not a fixed enum, so this maps
// common keywords to an icon and falls back to a generic sparkle rather
// than silently dropping an amenity the admin phrased differently.
function amenityIcon(label: string): LucideIcon {
  const value = label.toLowerCase();
  if (value.includes("wi-fi") || value.includes("wifi")) return Wifi;
  if (value.includes("coffee") || value.includes("mini bar") || value.includes("minibar")) return Coffee;
  if (value.includes("tv") || value.includes("television")) return Tv;
  if (value.includes("air condition") || value.includes(" ac") || value.startsWith("ac")) return Wind;
  if (value.includes("bath")) return Bath;
  if (value.includes("parking") || value.includes("car")) return Car;
  return Sparkles;
}

export function RoomsSection({ onSelectRoom }: RoomsSectionProps) {
  const { content } = useSiteContent();
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadCategories() {
    const result = await loadRoomCategories({ sellableOnly: true });
    setCategories(result.data);
    setLoadError(result.error);
    setIsLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("room_categories_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_categories" },
        () => {
          loadCategories();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  return (
    <section id="rooms" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          Rooms &amp; Suites
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
          A Room for Every Kind of Stay
        </h2>
        <p className="mt-4 text-base leading-relaxed text-white/70">
          {content.rooms_intro}
        </p>
      </div>

      {isLoading && (
        <div className="glass-panel mt-14 flex items-center justify-center gap-3 rounded-xl p-10 text-sm text-white/40">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
          Loading rooms…
        </div>
      )}

      {!isLoading && loadError && (
        <div
          className="glass-panel mt-14 rounded-xl p-10 text-center text-sm text-red-400"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && categories.length === 0 && (
        <div className="glass-panel mt-14 rounded-xl p-10 text-center text-sm text-white/50">
          No rooms are currently listed. Please check back soon.
        </div>
      )}

      {!isLoading && !loadError && categories.length > 0 && (
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {categories.map((room) => {
            const amenities = parseAmenities(room.amenities);

            return (
              <div
                key={room.id}
                className="group flex flex-col overflow-hidden border border-slate-800"
              >
                <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
                  <img
                    src={room.cover_photo_url || heroFallback}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background-dark to-transparent opacity-80" />

                  <div className="absolute left-4 top-4 rounded bg-primary/90 px-3 py-1 text-xs font-bold tracking-wide text-slate-950">
                    {room.is_unavailable ? "Waitlist" : "Available"}
                  </div>

                  <div className="absolute bottom-5 left-6">
                    <span className="font-display text-2xl text-primary">
                      ₹{room.nightly_rate.toLocaleString("en-IN")}
                    </span>
                    <span className="ml-1 text-sm font-light text-white/70">
                      /night
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-8">
                  <h3 className="font-display mb-4 text-2xl text-white">
                    {room.name}
                  </h3>
                  <p className="mb-8 flex-1 text-sm font-light leading-relaxed text-white/60">
                    {room.description}
                  </p>

                  {amenities.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-4">
                      {amenities.map((amenity) => {
                        const Icon = amenityIcon(amenity);
                        return (
                          <div
                            key={amenity}
                            title={amenity}
                            className="text-white/40 transition-colors group-hover:text-primary"
                          >
                            <Icon size={18} strokeWidth={1.5} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <a
                    href="#booking"
                    onClick={() => onSelectRoom(room.id)}
                    className="group/btn relative w-full overflow-hidden border border-slate-700 py-3 text-center text-xs font-semibold tracking-widest text-white transition-all duration-300 hover:text-slate-950"
                  >
                    <span className="relative z-10">RESERVE NOW</span>
                    <div className="absolute inset-0 -translate-x-full bg-primary transition-transform duration-500 ease-out group-hover/btn:translate-x-0" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
