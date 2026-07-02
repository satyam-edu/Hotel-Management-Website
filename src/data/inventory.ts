export type PhysicalRoomCategory =
  | "Deluxe"
  | "Deluxe (Twin)"
  | "Executive"
  | "Executive (Twin)"
  | "Suite";

export interface PhysicalRoomEntry {
  room_number: string;
  category_name: PhysicalRoomCategory;
}

export const PHYSICAL_ROOMS: PhysicalRoomEntry[] = [
  { room_number: "201", category_name: "Deluxe (Twin)" },
  { room_number: "202", category_name: "Deluxe" },
  { room_number: "203", category_name: "Executive" },
  { room_number: "204", category_name: "Executive" },
  { room_number: "205", category_name: "Executive" },
  { room_number: "206", category_name: "Executive" },
  { room_number: "207", category_name: "Executive" },
  { room_number: "208", category_name: "Executive" },
  { room_number: "209", category_name: "Executive" },
  { room_number: "210", category_name: "Executive" },
  { room_number: "211", category_name: "Executive" },
  { room_number: "212", category_name: "Executive" },
  { room_number: "214", category_name: "Executive" },
  { room_number: "215", category_name: "Executive" },
  { room_number: "216", category_name: "Executive (Twin)" },
  { room_number: "301", category_name: "Suite" },
  { room_number: "302", category_name: "Executive" },
  { room_number: "303", category_name: "Executive" },
];
