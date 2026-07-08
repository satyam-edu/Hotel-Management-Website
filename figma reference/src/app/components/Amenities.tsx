import { Utensils, Music, Wifi, Car, BedDouble, Dumbbell, Coffee, Shield } from "lucide-react";
import { motion } from "motion/react";

const amenities = [
  {
    icon: Utensils,
    title: "Multi-Cuisine Restaurant",
    description: "Savor authentic Indian, Chinese, and Continental cuisines prepared by our expert chefs using fresh, locally sourced ingredients.",
  },
  {
    icon: Music,
    title: "Grand Banquet Hall",
    description: "Host weddings, receptions, and celebrations in our opulent banquet hall with a capacity of 500+ guests and full event management.",
  },
  {
    icon: BedDouble,
    title: "Conference Facilities",
    description: "State-of-the-art conference rooms equipped with audio-visual technology, ideal for corporate meetings and business events.",
  },
  {
    icon: Wifi,
    title: "High-Speed Wi-Fi",
    description: "Complimentary high-speed internet access throughout the hotel — lobby, rooms, restaurant, and meeting areas.",
  },
  {
    icon: Car,
    title: "Ample Parking",
    description: "Secure and spacious parking facility for cars and coaches, with 24/7 security surveillance for your peace of mind.",
  },
  {
    icon: Coffee,
    title: "24/7 Room Service",
    description: "Round-the-clock in-room dining with an extensive menu ranging from light snacks to full meals, served right to your door.",
  },
  {
    icon: Dumbbell,
    title: "Fitness Center",
    description: "Stay active with our well-equipped gymnasium featuring modern cardio and strength training equipment.",
  },
  {
    icon: Shield,
    title: "24/7 Security",
    description: "Advanced CCTV surveillance, trained security personnel, and digital key access ensuring complete safety throughout your stay.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function Amenities() {
  return (
    <section
      id="amenities"
      className="w-full py-24 lg:py-32 relative"
      style={{ background: "#0F1E3C" }}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={itemVariants}
          className="text-center mb-16"
        >
          <span
            className="text-xs tracking-[0.4em] uppercase"
            style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
          >
            What We Offer
          </span>
          <h2
            className="mt-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#fff",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 1.25,
            }}
          >
            Hotel Services & Amenities
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {amenities.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                variants={itemVariants}
                key={item.title}
                className="group p-8 transition-all duration-500 hover:-translate-y-2 relative"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(to bottom right, rgba(201,168,76,0.05), transparent)" }} />
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-6 relative z-10 transition-transform duration-500 group-hover:scale-110"
                  style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  <Icon size={24} color="#C9A84C" strokeWidth={1.5} />
                </div>
                <h3
                  className="mb-4 text-xl relative z-10 transition-colors duration-300 group-hover:text-[#C9A84C]"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#fff",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed relative z-10"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
