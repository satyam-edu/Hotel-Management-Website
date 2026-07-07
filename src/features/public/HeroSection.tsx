import { useSystemContext } from "../../context/SystemContext";
import { useSiteContent } from "../../context/SiteContentContext";
import heroFallback from "../../assets/hero.png";

export function HeroSection() {
  const { config } = useSystemContext();
  const { content } = useSiteContent();
  const backgroundUrl = config.hero_bg_url || heroFallback;

  return (
    <section
      id="home"
      className="relative flex h-screen min-h-[640px] w-full items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(var(--color-background-rgb), 0.25) 0%, rgba(var(--color-background-rgb), 0.92) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Padrauna, Kushinagar
        </p>
        <h1 className="font-display mt-4 text-4xl font-bold text-white sm:text-5xl md:text-6xl">
          {content.hero_title}
        </h1>
        <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
          {content.hero_subtitle}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#rooms"
            className="rounded-sm bg-primary px-10 py-4 text-xs uppercase tracking-widest text-background-dark transition-opacity duration-300 hover:opacity-90"
          >
            {content.hero_cta}
          </a>
          <a
            href="#rooms"
            className="rounded-sm border border-white/20 px-10 py-4 text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-white/10"
          >
            Explore Rooms
          </a>
        </div>
      </div>
    </section>
  );
}
