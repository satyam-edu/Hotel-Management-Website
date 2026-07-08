export function About() {
  const propertyImg =
    "https://images.unsplash.com/photo-1582998451055-5ce52763e246?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwSW5kaWElMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzgyOTE3NjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080";

  return (
    <section
      id="about"
      className="w-full py-20 lg:py-28"
      style={{ background: "#0F1E3C" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <div>
            <span
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
            >
              Our Story
            </span>
            <h2
              className="mt-3 mb-6"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                lineHeight: 1.25,
              }}
            >
              A Legacy of Warmth<br />in Kushinagar
            </h2>
            <p
              className="mb-5 leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.65)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.95rem",
              }}
            >
              Situated on the NH Bypass Road in Padrauna, Hotel Kamla Inn Grand stands as a beacon of
              refined hospitality in the Kushinagar district of Uttar Pradesh. Strategically located
              along the highway, we welcome pilgrims visiting the sacred Kushinagar Buddhist circuit,
              business travelers, and families seeking a premium stay in the region.
            </p>
            <p
              className="mb-8 leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.65)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.95rem",
              }}
            >
              Our philosophy is simple: every guest deserves to feel at home while experiencing the
              finest comforts. From our attentive front desk staff to our thoughtfully designed rooms,
              every detail at Hotel Kamla Inn Grand is crafted to make your stay exceptional — whether
              you are here for a single night or celebrating life's most meaningful moments.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {[
                { number: "50+", label: "Elegant Rooms" },
                { number: "2", label: "Banquet Halls" },
                { number: "24/7", label: "Guest Service" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="text-2xl"
                    style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}
                  >
                    {stat.number}
                  </div>
                  <div
                    className="text-xs mt-1 tracking-wide"
                    style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div className="relative">
            <div
              className="absolute -top-4 -left-4 w-full h-full rounded-lg"
              style={{ border: "1px solid rgba(201,168,76,0.3)" }}
            />
            <img
              src={propertyImg}
              alt="Hotel Kamla Inn Grand property"
              className="relative w-full h-[420px] lg:h-[500px] object-cover rounded-lg"
            />
            <div
              className="absolute bottom-6 left-6 right-6 rounded px-5 py-4"
              style={{
                background: "rgba(15,30,60,0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(201,168,76,0.25)",
              }}
            >
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', sans-serif" }}
              >
                📍 NH Bypass Road, Padrauna<br />
                Kushinagar District, Uttar Pradesh
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
