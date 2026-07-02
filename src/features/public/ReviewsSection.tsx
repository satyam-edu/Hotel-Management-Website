import { Star } from "lucide-react";

interface GuestReview {
  id: string;
  name: string;
  location: string;
  quote: string;
}

const DUMMY_REVIEWS: GuestReview[] = [
  {
    id: "review-1",
    name: "Anita Sharma",
    location: "Gorakhpur",
    quote:
      "We hosted our daughter's wedding here and the banquet hall, lawn, and staff were beyond our expectations. Every guest went home impressed.",
  },
  {
    id: "review-2",
    name: "Rajesh Verma",
    location: "Lucknow",
    quote:
      "Clean rooms, courteous staff, and the most comfortable stay we've had along NH-28. The restaurant's Awadhi thali is worth the trip alone.",
  },
  {
    id: "review-3",
    name: "Priya Singh",
    location: "Varanasi",
    quote:
      "Arrived late at night with family and the front desk handled everything smoothly. Felt looked after, not processed. Will definitely return.",
  },
];

export function ReviewsSection() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          Guest Reviews
        </p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-4xl">
          What Our Guests Say
        </h2>
      </div>

      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {DUMMY_REVIEWS.map((review) => (
          <figure
            key={review.id}
            className="glass-panel flex flex-col rounded-xl p-6 sm:p-8"
          >
            <div className="flex gap-1" aria-label="Rated 5 out of 5 stars">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={16}
                  className="fill-primary text-primary"
                />
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
                {review.location}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
