import { HeroSection } from "../../features/public/HeroSection";
import { AboutSection } from "../../features/public/AboutSection";
import { RoomsSection } from "../../features/public/RoomsSection";
import { GallerySection } from "../../features/public/GallerySection";
import { ReviewsSection } from "../../features/public/ReviewsSection";
import { BookingFormSection } from "../../features/public/BookingFormSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <RoomsSection />
      <GallerySection />
      <ReviewsSection />
      <BookingFormSection />
    </>
  );
}
