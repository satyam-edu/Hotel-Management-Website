import { Wifi, Coffee, Tv, Wind, Bath, Car } from "lucide-react";
import { motion } from "motion/react";

const rooms = [
  {
    id: "deluxe",
    name: "Deluxe Room",
    price: 2499,
    image: "https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
    description: "Spacious and elegantly furnished with a plush king-size bed, en-suite bathroom, and modern amenities for a restful stay.",
    amenities: [Wifi, Coffee, Tv, Wind],
    badge: "Best Value",
  },
  {
    id: "super-deluxe",
    name: "Super Deluxe Room",
    price: 3499,
    image: "https://images.unsplash.com/photo-1631049307290-bb947b114627?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
    description: "An upgraded experience with premium bedding, a sitting area, city views, and exclusive in-room dining options.",
    amenities: [Wifi, Coffee, Tv, Wind, Bath],
    badge: null,
  },
  {
    id: "suite",
    name: "Executive Suite",
    price: 5499,
    image: "https://images.unsplash.com/photo-1685592437742-3b56edb46b15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
    description: "Our flagship suite featuring a separate living room, dining space, luxury bathroom with soaking tub, and panoramic views.",
    amenities: [Wifi, Coffee, Tv, Wind, Bath, Car],
    badge: "Premium",
  },
  {
    id: "family",
    name: "Family Suite",
    price: 4499,
    image: "https://images.unsplash.com/photo-1646974400439-321c4a9240b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
    description: "Designed for families, this suite accommodates up to 4 guests comfortably with twin beds and a cozy lounge area.",
    amenities: [Wifi, Coffee, Tv, Wind],
    badge: "Family Pick",
  },
  {
    id: "standard",
    name: "Standard Room",
    price: 1799,
    image: "https://images.unsplash.com/photo-1515362778563-6a8d0e44bc0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=800",
    description: "Comfortable and well-appointed room ideal for solo travelers and business guests seeking quality at an accessible price.",
    amenities: [Wifi, Tv, Wind],
    badge: null,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function Rooms({ onBookRoom }: { onBookRoom: (roomId: string) => void }) {
  return (
    <section
      id="rooms"
      className="w-full py-24 lg:py-32 relative overflow-hidden"
      style={{ background: "#091628" }}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #17325e 0%, transparent 70%)" }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
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
            Accommodations
          </span>
          <h2
            className="mt-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#fff",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 1.2,
            }}
          >
            Rooms & Suites
          </h2>
          <p
            className="mt-6 max-w-2xl mx-auto"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              lineHeight: 1.7,
            }}
          >
            Each room is thoughtfully designed to blend comfort with elegance,
            offering everything you need for a memorable stay.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {rooms.map((room) => (
            <motion.div
              variants={itemVariants}
              key={room.id}
              className="group relative flex flex-col bg-white/[0.02] border border-white/10 overflow-hidden"
              style={{
                borderRadius: "2px",
              }}
            >
              {/* Image */}
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#091628] to-transparent opacity-80" />
                
                {/* Price badge */}
                <div
                  className="absolute bottom-5 left-6"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#C9A84C",
                    fontSize: "1.5rem",
                  }}
                >
                  ₹{room.price.toLocaleString("en-IN")}
                  <span
                    className="text-sm ml-1"
                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, color: "rgba(255,255,255,0.7)" }}
                  >
                    /night
                  </span>
                </div>
                {/* Category badge */}
                {room.badge && (
                  <div
                    className="absolute top-5 left-5 px-3 py-1.5 text-[10px] tracking-widest uppercase"
                    style={{
                      background: "#C9A84C",
                      color: "#0F1E3C",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {room.badge}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col flex-grow">
                <h3
                  className="mb-4 text-2xl"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#fff",
                  }}
                >
                  {room.name}
                </h3>
                <p
                  className="text-sm mb-8 leading-relaxed flex-grow"
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {room.description}
                </p>

                {/* Amenity icons */}
                <div className="flex gap-4 mb-8">
                  {room.amenities.map((Icon, i) => (
                    <div
                      key={i}
                      className="text-white/40 transition-colors group-hover:text-[#C9A84C]"
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onBookRoom(room.id)}
                  className="w-full py-4 text-xs tracking-[0.2em] uppercase transition-all duration-300 relative overflow-hidden group/btn"
                  style={{
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <span className="relative z-10 transition-colors group-hover/btn:text-[#091628]">Reserve Now</span>
                  <div className="absolute inset-0 bg-[#C9A84C] -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 ease-out" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
