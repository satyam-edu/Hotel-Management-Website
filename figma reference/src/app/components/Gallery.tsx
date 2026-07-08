import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Expanded to simulate a larger gallery (30-40 photos behavior)
const photos = [
  { id: 1, category: "Exterior", src: "https://images.unsplash.com/photo-1746702475498-14af9f577c62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Hotel grand lobby", span: "col-span-2 row-span-2" },
  { id: 2, category: "Rooms", src: "https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Deluxe room", span: "" },
  { id: 3, category: "Events", src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Banquet hall setup", span: "" },
  { id: 4, category: "Amenities", src: "https://images.unsplash.com/photo-1670529776286-f426fb7ba42c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Conference room", span: "" },
  { id: 5, category: "Exterior", src: "https://images.unsplash.com/photo-1759038085938-83b376bbf7d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Lounge area", span: "col-span-2" },
  { id: 6, category: "Rooms", src: "https://images.unsplash.com/photo-1685592437742-3b56edb46b15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Executive suite", span: "" },
  { id: 7, category: "Rooms", src: "https://images.unsplash.com/photo-1631049307290-bb947b114627?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Super deluxe room", span: "" },
  { id: 8, category: "Dining", src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Restaurant setup", span: "" },
  { id: 9, category: "Dining", src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Fine dining", span: "row-span-2" },
  { id: 10, category: "Events", src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Outdoor lawn setup", span: "col-span-2" },
  { id: 11, category: "Amenities", src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Spa & Wellness", span: "" },
  { id: 12, category: "Rooms", src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Standard Room", span: "" },
  { id: 13, category: "Exterior", src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Poolside", span: "" },
  { id: 14, category: "Rooms", src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Suite View", span: "" },
  { id: 15, category: "Dining", src: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Restaurant Interior", span: "" },
  { id: 16, category: "Amenities", src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800", alt: "Gym", span: "" },
];

const categories = ["All", "Exterior", "Rooms", "Dining", "Events", "Amenities"];
const INITIAL_VISIBLE_COUNT = 8;

export function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showFullGallery, setShowFullGallery] = useState(false);

  // Prevent body scroll when full gallery or lightbox is open
  useEffect(() => {
    if (showFullGallery || lightbox !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showFullGallery, lightbox]);

  const filteredPhotos = photos.filter(
    (photo) => activeCategory === "All" || photo.category === activeCategory
  );

  const displayedPhotos = filteredPhotos.slice(0, INITIAL_VISIBLE_COUNT);

  const prev = () =>
    setLightbox((v) => (v === null ? null : (v - 1 + filteredPhotos.length) % filteredPhotos.length));
  const next = () =>
    setLightbox((v) => (v === null ? null : (v + 1) % filteredPhotos.length));

  return (
    <>
      <section
        id="gallery"
        className="w-full py-24 lg:py-32"
        style={{ background: "#091628" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span
              className="text-xs tracking-[0.4em] uppercase"
              style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
            >
              Visual Tour
            </span>
            <h2
              className="mt-4 mb-8"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
              }}
            >
              Photo Gallery
            </h2>

            {/* Category Filters for Main Page */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-5 py-2 rounded-full text-xs tracking-wider uppercase transition-all duration-300"
                  style={{
                    background: activeCategory === cat ? "rgba(201,168,76,0.15)" : "transparent",
                    color: activeCategory === cat ? "#C9A84C" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${activeCategory === cat ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.1)"}`,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Grid - Strictly limited to 8 items */}
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] md:auto-rows-[250px] gap-4 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {displayedPhotos.map((photo, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  key={photo.id}
                  className={`relative overflow-hidden cursor-pointer group ${activeCategory === "All" ? photo.span : ""}`}
                  style={{ borderRadius: "4px" }}
                  onClick={() => setLightbox(i)}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center"
                    style={{ background: "rgba(9,22,40,0.6)", backdropFilter: "blur(2px)" }}
                  >
                    <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span
                        className="text-[10px] tracking-[0.2em] uppercase text-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        View
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Open Full Gallery Modal Button */}
          {filteredPhotos.length > INITIAL_VISIBLE_COUNT && (
            <motion.div layout className="mt-14 flex justify-center">
              <button
                onClick={() => setShowFullGallery(true)}
                className="px-8 py-3.5 rounded text-xs tracking-[0.15em] uppercase transition-all duration-300 hover:bg-white/5"
                style={{
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#C9A84C",
                  fontFamily: "'Inter', sans-serif",
                  background: "rgba(201,168,76,0.05)",
                }}
              >
                View Full Gallery
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Full Gallery Overlay Modal */}
      <AnimatePresence>
        {showFullGallery && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] overflow-y-auto"
            style={{ background: "#060F20" }}
          >
            <div className="min-h-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#fff",
                    fontSize: "2rem",
                  }}
                >
                  Complete Gallery
                </h2>
                <button
                  onClick={() => setShowFullGallery(false)}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: "#fff", background: "rgba(255,255,255,0.05)" }}
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              {/* Category Filters for Modal */}
              <div className="flex flex-wrap gap-2 mb-10">
                {categories.map((cat) => (
                  <button
                    key={`modal-${cat}`}
                    onClick={() => setActiveCategory(cat)}
                    className="px-5 py-2 rounded-full text-xs tracking-wider uppercase transition-all duration-300"
                    style={{
                      background: activeCategory === cat ? "rgba(201,168,76,0.15)" : "transparent",
                      color: activeCategory === cat ? "#C9A84C" : "rgba(255,255,255,0.5)",
                      border: `1px solid ${activeCategory === cat ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.1)"}`,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Full Grid */}
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] md:auto-rows-[250px] gap-4 lg:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredPhotos.map((photo, i) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      key={`full-${photo.id}`}
                      className={`relative overflow-hidden cursor-pointer group ${activeCategory === "All" ? photo.span : ""}`}
                      style={{ borderRadius: "4px" }}
                      onClick={() => setLightbox(i)}
                    >
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center"
                        style={{ background: "rgba(9,22,40,0.6)", backdropFilter: "blur(2px)" }}
                      >
                        <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <span
                            className="text-[10px] tracking-[0.2em] uppercase text-white"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            View
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70] flex items-center justify-center"
            style={{ background: "rgba(5,10,25,0.98)", backdropFilter: "blur(10px)" }}
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "#fff" }}
              onClick={() => setLightbox(null)}
            >
              <X size={24} strokeWidth={1.5} />
            </button>
            
            {filteredPhotos.length > 1 && (
              <button
                className="absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: "#fff" }}
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft size={32} strokeWidth={1} />
              </button>
            )}
            
            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              src={filteredPhotos[lightbox].src}
              alt={filteredPhotos[lightbox].alt}
              className="max-h-[85vh] max-w-[85vw] object-contain shadow-2xl"
              style={{ borderRadius: "4px" }}
              onClick={(e) => e.stopPropagation()}
            />
            
            {filteredPhotos.length > 1 && (
              <button
                className="absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: "#fff" }}
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronRight size={32} strokeWidth={1} />
              </button>
            )}
            
            <span
              className="absolute bottom-8 text-xs tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}
            >
              {lightbox + 1} / {filteredPhotos.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
