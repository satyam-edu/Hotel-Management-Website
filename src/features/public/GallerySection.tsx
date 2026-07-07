import { useState } from "react";
import heroFallback from "../../assets/hero.png";
import { useSiteContent } from "../../context/SiteContentContext";

interface GalleryImage {
  id: string;
  category: "Rooms" | "Banquets" | "Lawn";
  url: string;
  alt: string;
}

const DUMMY_IMAGES: GalleryImage[] = [
  { id: "room-1", category: "Rooms", url: heroFallback, alt: "Deluxe room interior" },
  { id: "room-2", category: "Rooms", url: heroFallback, alt: "Executive suite bed" },
  { id: "room-3", category: "Rooms", url: heroFallback, alt: "Family room seating" },
  { id: "banquet-1", category: "Banquets", url: heroFallback, alt: "Banquet hall setup" },
  { id: "banquet-2", category: "Banquets", url: heroFallback, alt: "Reception dinner arrangement" },
  { id: "lawn-1", category: "Lawn", url: heroFallback, alt: "Outdoor event lawn" },
  { id: "lawn-2", category: "Lawn", url: heroFallback, alt: "Evening lawn decor" },
  { id: "lawn-3", category: "Lawn", url: heroFallback, alt: "Wedding mandap on the lawn" },
];

const CATEGORIES = ["All", "Rooms", "Banquets", "Lawn"] as const;
type Category = (typeof CATEGORIES)[number];

export function GallerySection() {
  const { content } = useSiteContent();
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  return (
    <section id="gallery" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          Gallery
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
          {content.gallery_header}
        </h2>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-5 py-2 text-xs uppercase tracking-widest transition-colors duration-300 ${
              activeCategory === category
                ? "bg-primary text-background-dark"
                : "glass-panel text-white/60 hover:text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {DUMMY_IMAGES.map((image) => {
          const isVisible = activeCategory === "All" || activeCategory === image.category;

          return (
            <div
              key={image.id}
              hidden={!isVisible}
              className="group aspect-square overflow-hidden rounded-xl"
            >
              <img
                src={image.url}
                alt={image.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
