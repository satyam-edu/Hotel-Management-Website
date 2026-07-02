import { useSystemContext } from "../../context/SystemContext";
import heroFallback from "../../assets/hero.png";

export function HeroSection() {
  const { config } = useSystemContext();
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
          Hotel Kamala Inn Grand
        </h1>
        <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
          Where every stay, celebration, and gathering is treated with the
          warmth of home and the polish of a landmark address.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#rooms"
            className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-background-dark transition-transform hover:scale-105"
          >
            Book Your Stay
          </a>
          <a
            href="#rooms"
            className="glass-panel rounded-full px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Explore Rooms
          </a>
        </div>
      </div>
    </section>
  );
}
