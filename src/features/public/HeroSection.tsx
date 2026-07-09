import { motion } from "motion/react";
import { useSystemContext } from "../../context/SystemContext";
import { useSiteContent } from "../../context/SiteContentContext";
import heroFallback from "../../assets/hero.png";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  const { config } = useSystemContext();
  const { content } = useSiteContent();
  const backgroundUrl = config.hero_bg_url || heroFallback;

  return (
    <section
      id="home"
      className="relative flex h-screen min-h-[640px] w-full items-center justify-center overflow-hidden"
    >
      <motion.div
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "linear" }}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(var(--color-background-rgb), 0.25) 0%, rgba(var(--color-background-rgb), 0.92) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT_EXPO }}
          className="text-sm font-medium uppercase tracking-[0.2em] text-primary"
        >
          Padrauna, Kushinagar
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75, ease: EASE_OUT_EXPO }}
          className="font-display mt-4 text-4xl font-bold text-white sm:text-5xl md:text-6xl"
        >
          {content.hero_title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: EASE_OUT_EXPO }}
          className="mt-5 max-w-xl text-base text-white/80 sm:text-lg"
        >
          {content.hero_subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05, ease: EASE_OUT_EXPO }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <a
            href="#rooms"
            className="group relative overflow-hidden rounded-sm bg-primary px-10 py-4 text-xs uppercase tracking-widest text-background-dark transition-transform duration-300 active:scale-95"
          >
            <span className="relative z-10">{content.hero_cta}</span>
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-white/30 transition-transform duration-500 ease-out group-hover:scale-y-100" />
          </a>
          <a
            href="#rooms"
            className="group relative overflow-hidden rounded-sm border border-white/20 px-10 py-4 text-xs uppercase tracking-widest text-white transition-transform duration-300 active:scale-95"
          >
            <span className="relative z-10">Explore Rooms</span>
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-white/10 transition-transform duration-500 ease-out group-hover:scale-y-100" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
