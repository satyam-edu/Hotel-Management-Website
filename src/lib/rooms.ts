import { supabase } from "./supabase";
import type { PhysicalRoom, RoomCategory } from "../types/database";

export type PhysicalRoomWithCategory = PhysicalRoom & {
  category_name: string;
  nightly_rate: number;
  max_adults: number;
  max_children: number;
};

export async function loadRoomCategories(
  options: { sellableOnly?: boolean } = {},
): Promise<{
  data: RoomCategory[];
  error: string | null;
}> {
  if (!supabase) {
    return { data: [], error: "Database connection is not configured." };
  }

  let query = supabase.from("room_categories").select("*");

  if (options.sellableOnly) {
    query = query.eq("is_archived", false).eq("is_unavailable", false);
  }

  const { data, error } = await query.order("name");

  if (error) {
    console.error("Failed to load room categories:", error.message);
    return { data: [], error: "Could not load room categories." };
  }

  return { data: data ?? [], error: null };
}

export async function loadPhysicalRooms(): Promise<{
  data: PhysicalRoomWithCategory[];
  error: string | null;
}> {
  if (!supabase) {
    return { data: [], error: "Database connection is not configured." };
  }

  const { data, error } = await supabase
    .from("physical_rooms")
    .select("*, room_categories(name, nightly_rate, max_adults, max_children)")
    .order("room_number");

  if (error) {
    console.error("Failed to load physical rooms:", error.message);
    return { data: [], error: "Could not load physical rooms." };
  }

  const rooms = (data ?? []).map((row) => {
    const { room_categories, ...room } = row as PhysicalRoom & {
      room_categories: {
        name: string;
        nightly_rate: number;
        max_adults: number;
        max_children: number;
      } | null;
    };
    return {
      ...room,
      category_name: room_categories?.name ?? "Unknown",
      nightly_rate: room_categories?.nightly_rate ?? 0,
      max_adults: room_categories?.max_adults ?? 1,
      max_children: room_categories?.max_children ?? 0,
    };
  });

  return { data: rooms, error: null };
}
