import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const reviews = [
  {
    name: "Rajesh Kumar",
    location: "Lucknow, UP",
    rating: 5,
    text: "Absolutely fantastic stay! The rooms are beautifully decorated, the food from the restaurant is exceptional, and the staff is incredibly welcoming. Hotel Kamla Inn Grand truly lives up to its name. Will definitely return for our next visit to Kushinagar.",
    avatar: "RK",
    date: "May 2025",
  },
  {
    name: "Priya Sharma",
    location: "Gorakhpur, UP",
    rating: 5,
    text: "We hosted our daughter's wedding reception here and it was absolutely perfect. The banquet hall is grand, the catering was superb, and the event management team handled everything flawlessly. Our guests couldn't stop complimenting the venue.",
    avatar: "PS",
    date: "April 2025",
  },
  {
    name: "Vikram Singh",
    location: "Delhi",
    rating: 4,
    text: "Stayed here during a business trip. The conference facilities are top-notch, Wi-Fi is fast and reliable, and the executive suite provided all the comfort I needed after long meetings. Excellent value for the price. Highly recommend for business travelers.",
    avatar: "VS",
    date: "March 2025",
  },
  {
    name: "Ananya Patel",
    location: "Mumbai",
    rating: 5,
    text: "A hidden gem on the NH Bypass! The location is very convenient. The rooms are spacious and spotlessly clean. The restaurant serves amazing North Indian food. 24/7 room service is a great feature. Will surely recommend to family and friends.",
    avatar: "AP",
    date: "February 2025",
  },
  {
    name: "Suresh Mishra",
    location: "Varanasi, UP",
    rating: 5,
    text: "We were visiting the Buddhist pilgrimage sites in Kushinagar and chose Kamla Inn Grand as our base. Perfect location, peaceful atmosphere, comfortable beds. The staff arranged a guided tour on our request. Outstanding hospitality!",
    avatar: "SM",
    date: "January 2025",
  },
];

export function Reviews() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((v) => (v - 1 + reviews.length) % reviews.length);
  const next = () => setCurrent((v) => (v + 1) % reviews.length);

  const getVisible = () => {
    return [
      reviews[(current - 1 + reviews.length) % reviews.length],
      reviews[current],
      reviews[(current + 1) % reviews.length],
    ];
  };

  return (
    <section
      id="reviews"
      className="w-full py-20 lg:py-28 overflow-hidden"
      style={{ background: "#0F1E3C" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
          >
            Guest Voices
          </span>
          <h2
            className="mt-3"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#fff",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            }}
          >
            What Our Guests Say
          </h2>
        </div>

        {/* Desktop: 3-card slider */}
        <div className="hidden md:grid grid-cols-3 gap-6 mb-10">
          {getVisible().map((review, i) => (
            <div
              key={i}
              className="rounded-xl p-6 transition-all duration-300"
              style={{
                background: i === 1 ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
                border: i === 1 ? "1px solid rgba(201,168,76,0.35)" : "1px solid rgba(255,255,255,0.07)",
                transform: i === 1 ? "scale(1.03)" : "scale(0.97)",
                opacity: i === 1 ? 1 : 0.65,
              }}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={14} fill="#C9A84C" color="#C9A84C" />
                ))}
              </div>
              <p
                className="text-sm leading-relaxed mb-6 italic"
                style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif" }}
              >
                "{review.text}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "#C9A84C", color: "#0F1E3C", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                >
                  {review.avatar}
                </div>
                <div>
                  <div
                    className="text-sm"
                    style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}
                  >
                    {review.name}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}
                  >
                    {review.location} · {review.date}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: single card */}
        <div className="md:hidden mb-10">
          <div
            className="rounded-xl p-6"
            style={{
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
          >
            <div className="flex gap-1 mb-4">
              {Array.from({ length: reviews[current].rating }).map((_, j) => (
                <Star key={j} size={14} fill="#C9A84C" color="#C9A84C" />
              ))}
            </div>
            <p
              className="text-sm leading-relaxed mb-6 italic"
              style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif" }}
            >
              "{reviews[current].text}"
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                style={{ background: "#C9A84C", color: "#0F1E3C", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
              >
                {reviews[current].avatar}
              </div>
              <div>
                <div className="text-sm" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                  {reviews[current].name}
                </div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>
                  {reviews[current].location} · {reviews[current].date}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ border: "1px solid rgba(201,168,76,0.35)", color: "#C9A84C" }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-2">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  background: i === current ? "#C9A84C" : "rgba(201,168,76,0.3)",
                }}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            style={{ border: "1px solid rgba(201,168,76,0.35)", color: "#C9A84C" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
