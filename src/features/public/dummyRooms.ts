import heroFallback from "../../assets/hero.png";

export interface DummyRoom {
  id: string;
  name: string;
  nightlyRate: number;
  coverPhotoUrl: string;
  amenities: string[];
}

export const DUMMY_ROOMS: DummyRoom[] = [
  {
    id: "deluxe-room",
    name: "Deluxe Room",
    nightlyRate: 2499,
    coverPhotoUrl: heroFallback,
    amenities: ["King bed", "Free Wi-Fi", "Air conditioning", "Room service"],
  },
  {
    id: "executive-suite",
    name: "Executive Suite",
    nightlyRate: 4299,
    coverPhotoUrl: heroFallback,
    amenities: ["Living area", "City view", "Mini bar", "Complimentary breakfast"],
  },
  {
    id: "family-room",
    name: "Family Room",
    nightlyRate: 3599,
    coverPhotoUrl: heroFallback,
    amenities: ["Two queen beds", "Extra bedding", "Free Wi-Fi", "Air conditioning"],
  },
];
