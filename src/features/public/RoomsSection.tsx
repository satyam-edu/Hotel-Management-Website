import { useEffect, useState } from "react";
import { Check } from "lucide-react";
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
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((room) => (
            <div
              key={room.id}
              className="glass-panel flex flex-col overflow-hidden rounded-xl"
            >
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={room.cover_photo_url || heroFallback}
                  alt={room.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute right-4 top-4 rounded-sm bg-primary px-3 py-1 text-sm font-semibold text-background-dark">
                  ₹{room.nightly_rate.toLocaleString("en-IN")} / night
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl font-semibold text-white">
                  {room.name}
                </h3>

                <ul className="mt-4 flex-1 space-y-2">
                  {parseAmenities(room.amenities).map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-2 text-sm text-white/70"
                    >
                      <Check size={16} className="shrink-0 text-primary" />
                      {amenity}
                    </li>
                  ))}
                </ul>

                <a
                  href="#booking"
                  onClick={() => onSelectRoom(room.id)}
                  className="mt-6 rounded-sm bg-primary py-2.5 text-center text-xs font-semibold uppercase tracking-widest text-background-dark transition-opacity duration-300 hover:opacity-90"
                >
                  Book Now
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
