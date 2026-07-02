import { Check } from "lucide-react";
import heroFallback from "../../assets/hero.png";

interface DummyRoom {
  id: string;
  name: string;
  nightlyRate: number;
  coverPhotoUrl: string;
  amenities: string[];
}

const DUMMY_ROOMS: DummyRoom[] = [
  {
    id: "deluxe-room",
    name: "Deluxe Room",
    nightlyRate: 2499,
    coverPhotoUrl: heroFallback,
    amenities: ["King bed", "Free Wi-Fi", "Air conditioning", "Room service"],
  },
  {
    id: "executive-suite",
    name: "Executive Suite",
    nightlyRate: 4299,
    coverPhotoUrl: heroFallback,
    amenities: ["Living area", "City view", "Mini bar", "Complimentary breakfast"],
  },
  {
    id: "family-room",
    name: "Family Room",
    nightlyRate: 3599,
    coverPhotoUrl: heroFallback,
    amenities: ["Two queen beds", "Extra bedding", "Free Wi-Fi", "Air conditioning"],
  },
];

export function RoomsSection() {
  return (
    <section id="rooms" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Rooms &amp; Suites
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
          A Room for Every Kind of Stay
        </h2>
        <p className="mt-4 text-base leading-relaxed text-white/70">
          From a quiet overnight stop to an extended family visit, every
          category is kept spotless, comfortable, and ready.
        </p>
      </div>

      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {DUMMY_ROOMS.map((room) => (
          <div
            key={room.id}
            className="glass-panel flex flex-col overflow-hidden rounded-2xl"
          >
            <div className="relative h-52 w-full overflow-hidden">
              <img
                src={room.coverPhotoUrl}
                alt={room.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-background-dark">
                ₹{room.nightlyRate.toLocaleString("en-IN")} / night
              </div>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-xl font-semibold text-white">
                {room.name}
              </h3>

              <ul className="mt-4 flex-1 space-y-2">
                {room.amenities.map((amenity) => (
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
                className="mt-6 rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-background-dark transition-transform hover:scale-[1.02]"
              >
                Book Now
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
