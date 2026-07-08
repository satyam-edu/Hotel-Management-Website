import { motion } from "motion/react";

export function Hero({ onBookNow }: { onBookNow: () => void }) {
  const heroImg =
    "https://images.unsplash.com/photo-1775113895544-40f0efa4dac4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwSW5kaWElMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzgyOTE3NjQ1fDA&ixlib=rb-4.1.0&q=80&w=1920";

  return (
    <section
      id="home"
      className="relative w-full overflow-hidden"
      style={{ height: "100dvh", minHeight: 600 }}
    >
      {/* Background photo with subtle zoom animation */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src={heroImg}
          alt="Hotel Kamla Inn Grand facade"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Elegant Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(15,30,60,0.3) 0%, rgba(9,22,40,0.6) 50%, #091628 100%)",
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xs tracking-[0.4em] uppercase mb-6"
          style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
        >
          NH Bypass Road, Padrauna · Kushinagar
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mb-6"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#fff",
            fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
            lineHeight: 1.1,
            fontWeight: 500,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          Where Luxury Meets<br />
          <em style={{ color: "#C9A84C", fontStyle: "italic", fontWeight: 400 }}>Warmth & Comfort</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-2xl mb-12"
          style={{
            color: "rgba(255,255,255,0.8)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            lineHeight: 1.8,
            fontWeight: 300,
          }}
        >
          Experience world-class hospitality in the heart of Uttar Pradesh.
          Your perfect stay awaits — from business travel to wedding celebrations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-6 items-center"
        >
          <button
            onClick={onBookNow}
            className="group relative px-10 py-4 overflow-hidden rounded-sm text-sm tracking-widest uppercase transition-all duration-500"
            style={{
              background: "#C9A84C",
              color: "#0F1E3C",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
            }}
          >
            <span className="relative z-10">Check Availability</span>
            <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          </button>
          <button
            onClick={() => {
              document.getElementById("rooms")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="group px-10 py-4 rounded-sm text-sm tracking-widest uppercase transition-all duration-500 hover:bg-white/10"
            style={{
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Explore Rooms
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span
          className="text-[10px] tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}
        >
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-16"
          style={{
            background: "linear-gradient(to bottom, rgba(201,168,76,0.8), transparent)",
          }}
        />
      </motion.div>
    </section>
  );
}
