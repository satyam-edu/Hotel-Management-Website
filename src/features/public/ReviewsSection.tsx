import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useSiteContent } from "../../context/SiteContentContext";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface GuestReview {
  id: string;
  name: string;
  location: string;
  quote: string;
  date: string;
}

const DUMMY_REVIEWS: GuestReview[] = [
  {
    id: "review-1",
    name: "Anita Sharma",
    location: "Gorakhpur",
    quote:
      "We hosted our daughter's wedding here and the banquet hall, lawn, and staff were beyond our expectations. Every guest went home impressed.",
    date: "November 2025",
  },
  {
    id: "review-2",
    name: "Rajesh Verma",
    location: "Lucknow",
    quote:
      "Clean rooms, courteous staff, and the most comfortable stay we've had along NH-28. The restaurant's Awadhi thali is worth the trip alone.",
    date: "January 2026",
  },
  {
    id: "review-3",
    name: "Priya Singh",
    location: "Varanasi",
    quote:
      "Arrived late at night with family and the front desk handled everything smoothly. Felt looked after, not processed. Will definitely return.",
    date: "September 2025",
  },
  {
    id: "review-4",
    name: "Vikram Malhotra",
    location: "Delhi",
    quote:
      "Came for the Buddha Purnima weekend to visit the Mahaparinirvana Temple and booked here for the location alone — the property itself was the real surprise. Spacious rooms, spotless bathrooms, and the staff arranged an early check-in without any fuss.",
    date: "May 2025",
  },
  {
    id: "review-5",
    name: "Sunita Pandey",
    location: "Patna",
    quote:
      "My son's reception was held in the banquet hall and I'm still getting compliments from relatives about how elegant the decor and lighting looked. The event team coordinated everything with the caterers seamlessly.",
    date: "December 2025",
  },
  {
    id: "review-6",
    name: "Arvind Tiwari",
    location: "Kushinagar",
    quote:
      "As locals, we've watched this property grow, and it's now our default recommendation for out-of-town family. The power backup and Wi-Fi never falter, which matters a lot during the summer.",
    date: "June 2025",
  },
  {
    id: "review-7",
    name: "Meenakshi Rao",
    location: "Varanasi",
    quote:
      "Traveled with my elderly parents for a pilgrimage circuit covering Kushinagar and Lumbini. The staff went out of their way to arrange wheelchair-friendly access and a quiet room away from the banquet side. Genuinely thoughtful hospitality.",
    date: "February 2026",
  },
  {
    id: "review-8",
    name: "Deepak Chaurasia",
    location: "Gorakhpur",
    quote:
      "Booked the outdoor lawn for a corporate offsite dinner and the setup exceeded what we'd planned for. The multi-cuisine spread had both Awadhi classics and continental options, and every dish was fresh and well-seasoned.",
    date: "October 2025",
  },
  {
    id: "review-9",
    name: "Kavita Nigam",
    location: "Lucknow",
    quote:
      "Second stay here in a year and the consistency is what impresses me most — same warm welcome, same spotless rooms, same excellent breakfast spread. Easy 20-minute drive to the Nirvana Stupa too.",
    date: "March 2026",
  },
  {
    id: "review-10",
    name: "Rohit Srivastava",
    location: "Patna",
    quote:
      "The banquet hall comfortably held over 300 guests for my brother's wedding reception with room to spare. Sound system, lighting, and the event staff's coordination made it stress-free for our family.",
    date: "January 2025",
  },
  {
    id: "review-11",
    name: "Neha Agarwal",
    location: "Delhi",
    quote:
      "Stopped here on a Buddhist circuit road trip and stayed two nights instead of the one we'd planned. The rooms were immaculate, and the restaurant staff even packed breakfast for our early departure to Lumbini.",
    date: "November 2025",
  },
  {
    id: "review-12",
    name: "Sanjay Dwivedi",
    location: "Gorakhpur",
    quote:
      "Reliable choice for business travel through Kushinagar — fast Wi-Fi, a quiet room, and a front desk that answers the phone at any hour. The restaurant's dal and kadhai paneer are consistently excellent.",
    date: "August 2025",
  },
  {
    id: "review-13",
    name: "Ritu Mishra",
    location: "Varanasi",
    quote:
      "Hosted a small pre-wedding ceremony on the lawn and the team helped us plan the layout weeks in advance over phone calls. On the day itself, everything was set up exactly as discussed — no last-minute surprises.",
    date: "April 2026",
  },
  {
    id: "review-14",
    name: "Ashok Kumar Yadav",
    location: "Lucknow",
    quote:
      "Visited with a group of twelve for a family reunion and the staff adjusted room allocations twice without complaint. Housekeeping was prompt every single day, and the property felt genuinely well maintained.",
    date: "December 2025",
  },
  {
    id: "review-15",
    name: "Shweta Trivedi",
    location: "Patna",
    quote:
      "The proximity to the pilgrimage sites made this the obvious base for our trip, but the comfortable beds and attentive room service are why we'd come back even without the temples nearby.",
    date: "February 2025",
  },
];

// Mirrors the card's own responsive width classes below (single column until
// the md breakpoint, three columns from md up) — driven by state rather than
// pure CSS because the slide's translateX percentage must match however
// many cards are actually visible at the current width.
function getItemsPerView(): number {
  if (typeof window === "undefined") return 3;
  return window.innerWidth >= 768 ? 3 : 1;
}

export function ReviewsSection() {
  const { content } = useSiteContent();
  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleResize() {
      setItemsPerView(getItemsPerView());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(DUMMY_REVIEWS.length - itemsPerView, 0);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  function goToPrev() {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function goToNext() {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  }

  const pageCount = maxIndex + 1;

  return (
    <section id="reviews" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          Guest Reviews
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
          What Our Guests Say
        </h2>
        {content.featured_review && (
          <blockquote className="mt-6 text-base italic leading-relaxed text-white/70">
            &ldquo;{content.featured_review}&rdquo;
          </blockquote>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.1 }}
        className="relative mt-14"
      >
        <div className="w-full overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
          >
            {DUMMY_REVIEWS.map((review) => (
              <div key={review.id} className="w-full shrink-0 md:w-[calc(33.333%-16px)]">
                <figure className="glass-panel flex h-full flex-col rounded-xl p-6 sm:p-8">
                  <div className="flex gap-1" aria-label="Rated 5 out of 5 stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={16} className="fill-primary text-primary" />
                    ))}
                  </div>

                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/75">
                    &ldquo;{review.quote}&rdquo;
                  </blockquote>

                  <figcaption className="mt-6 border-t border-white/10 pt-4">
                    <p className="font-display text-base font-semibold text-white">
                      {review.name}
                    </p>
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-white/40">
                      {review.location} &middot; {review.date}
                    </p>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>

        {pageCount > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous reviews"
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 flex h-10 w-10 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background-dark text-white/70 transition-colors duration-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:-translate-x-5"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next reviews"
              onClick={goToNext}
              disabled={currentIndex === maxIndex}
              className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full border border-white/15 bg-background-dark text-white/70 transition-colors duration-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:translate-x-5"
            >
              <ChevronRight size={20} />
            </button>

            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? "w-6 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
}
