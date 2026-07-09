import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSiteContent } from "../../context/SiteContentContext";
import { loadGalleryImages, sortFoldersByPriority } from "../../lib/gallery";
import { supabase } from "../../lib/supabase";
import type { GalleryImage } from "../../types/database";

const INLINE_LIMIT = 8;

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const galleryGridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const galleryItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

export function GallerySection() {
  const { content } = useSiteContent();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>("All");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  async function loadImages() {
    const result = await loadGalleryImages({ activeOnly: true });
    setImages(result.data);
    setLoadError(result.error);
    setIsLoading(false);
  }

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("gallery_images_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_images" },
        () => loadImages(),
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const folders = sortFoldersByPriority(
    Array.from(new Set(images.map((image) => image.folder_tag))),
  );
  const categories = ["All", ...folders];
  const filteredImages = images.filter(
    (image) => activeFolder === "All" || activeFolder === image.folder_tag,
  );
  const inlineImages = filteredImages.slice(0, INLINE_LIMIT);
  const totalImages = filteredImages.length;

  useEffect(() => {
    if (activePhotoIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePhotoIndex(null);
      if (event.key === "ArrowLeft") {
        setActivePhotoIndex((v) => (v === null ? null : (v - 1 + totalImages) % totalImages));
      }
      if (event.key === "ArrowRight") {
        setActivePhotoIndex((v) => (v === null ? null : (v + 1) % totalImages));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoIndex, totalImages]);

  function showPrevPhoto() {
    setActivePhotoIndex((v) => (v === null ? null : (v - 1 + totalImages) % totalImages));
  }

  function showNextPhoto() {
    setActivePhotoIndex((v) => (v === null ? null : (v + 1) % totalImages));
  }

  return (
    <section id="gallery" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          Gallery
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
          {content.gallery_header}
        </h2>
      </motion.div>

      {!isLoading && !loadError && images.length > 0 && (
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveFolder(category)}
              className={`rounded-full px-5 py-2 text-xs uppercase tracking-widest transition-colors duration-300 ${
                activeFolder === category
                  ? "bg-primary text-background-dark"
                  : "glass-panel text-white/60 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="mt-10 flex items-center justify-center gap-3 text-sm text-white/40">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
          Loading gallery…
        </div>
      )}

      {!isLoading && loadError && (
        <p className="mt-10 text-center text-sm text-red-400" role="alert">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && images.length === 0 && (
        <div className="glass-panel mx-auto mt-10 max-w-md rounded-xl p-8 text-center text-sm text-white/40">
          No gallery photographs have been added yet. Please check back soon.
        </div>
      )}

      {!isLoading && !loadError && images.length > 0 && (
        <>
          <motion.div
            key={activeFolder}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={galleryGridVariants}
            className="gallery-cross-fade mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {inlineImages.map((image, index) => (
              <motion.div
                key={image.id}
                variants={galleryItemVariants}
                onClick={() => setActivePhotoIndex(index)}
                className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border border-slate-800/40 shadow-md"
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text || image.folder_tag}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white">
                      View
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {totalImages > INLINE_LIMIT && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setActivePhotoIndex(0)}
                className="flex items-center gap-2 rounded-full border border-primary/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary transition-colors duration-300 hover:bg-primary/10"
              >
                View Full Gallery
              </button>
            </div>
          )}
        </>
      )}

      {activePhotoIndex !== null && filteredImages[activePhotoIndex] && (
        <div
          className="lightbox-backdrop-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setActivePhotoIndex(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setActivePhotoIndex(null)}
            className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors duration-300 hover:bg-white/10"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {totalImages > 1 && (
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                showPrevPhoto();
              }}
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors duration-300 hover:bg-white/10 lg:left-12"
            >
              <ChevronLeft size={32} strokeWidth={1} />
            </button>
          )}

          <img
            key={activePhotoIndex}
            src={filteredImages[activePhotoIndex].image_url}
            alt={filteredImages[activePhotoIndex].alt_text || filteredImages[activePhotoIndex].folder_tag}
            className="lightbox-image-in max-h-[85vh] max-w-[85vw] rounded-sm object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {totalImages > 1 && (
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                showNextPhoto();
              }}
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors duration-300 hover:bg-white/10 lg:right-12"
            >
              <ChevronRight size={32} strokeWidth={1} />
            </button>
          )}

          <span className="absolute bottom-8 text-xs tracking-widest text-white/50">
            {activePhotoIndex + 1} / {totalImages}
          </span>
        </div>
      )}
    </section>
  );
}
