import { supabase } from "./supabase";
import type { PhysicalRoom, RoomCategory } from "../types/database";

export type PhysicalRoomWithCategory = PhysicalRoom & {
  category_name: string;
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
    .select("*, room_categories(name)")
    .order("room_number");

  if (error) {
    console.error("Failed to load physical rooms:", error.message);
    return { data: [], error: "Could not load physical rooms." };
  }

  const rooms = (data ?? []).map((row) => {
    const { room_categories, ...room } = row as PhysicalRoom & {
      room_categories: { name: string } | null;
    };
    return {
      ...room,
      category_name: room_categories?.name ?? "Unknown",
    };
  });

  return { data: rooms, error: null };
}
