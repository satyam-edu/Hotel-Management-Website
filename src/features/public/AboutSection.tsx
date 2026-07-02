import { useSystemContext } from "../../context/SystemContext";
import heroFallback from "../../assets/hero.png";

export function AboutSection() {
  const { config } = useSystemContext();
  const aboutPhoto = config.about_photo_url || heroFallback;

  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            About Us
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
            A Landmark of Hospitality in Kushinagar
          </h2>

          <p className="mt-6 text-base leading-relaxed text-white/75">
            Set along the NH-28 bypass in Padrauna, Hotel Kamala Inn Grand has
            grown into one of the district's most trusted addresses for
            travellers, families, and celebrations alike. What began as a
            modest wayside stop has become a full-service property known for
            its banquet halls, event lawns, and genuinely warm service — a
            reputation built one stay, one wedding, one gathering at a time.
          </p>

          <p className="mt-4 text-base leading-relaxed text-white/75">
            Our philosophy is simple: every guest should feel looked after,
            not processed. From a family arriving late off the highway to a
            wedding party hosting three hundred guests, the same attention to
            comfort, cleanliness, and courtesy carries through every corner
            of the property.
          </p>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl md:aspect-square">
          <img
            src={aboutPhoto}
            alt="Hotel Kamala Inn Grand property"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
