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

// Returns every room_number with a Confirmed/Checked-In reservation
// overlapping the given date range, so a room dropdown can filter down to
// vacant rooms in one query instead of one checkRoomAvailability() call per
// candidate room. excludeReservationId lets an in-progress edit exclude the
// reservation's own current stay from counting itself as an occupier.
export async function loadOccupiedRoomNumbers(
  checkIn: string,
  checkOut: string,
  excludeReservationId?: string,
): Promise<{ data: Set<string>; error: string | null }> {
  if (!supabase) {
    return { data: new Set(), error: "Database connection is not configured." };
  }

  let query = supabase
    .from("reservations")
    .select("room_number")
    .in("status", ["Confirmed", "Checked-In"])
    .lt("check_in_date", checkOut)
    .gt("check_out_date", checkIn);

  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load occupied rooms:", error.message);
    return { data: new Set(), error: "Could not verify room availability." };
  }

  const occupied = new Set(
    (data ?? [])
      .map((row) => row.room_number)
      .filter((roomNumber): roomNumber is string => Boolean(roomNumber)),
  );

  return { data: occupied, error: null };
}

export async function checkRoomAvailability(
  roomNumber: string,
  checkIn: string,
  checkOut: string,
  excludeReservationId?: string,
): Promise<{ isAvailable: boolean; error: string | null }> {
  if (!supabase) {
    return { isAvailable: false, error: "Database connection is not configured." };
  }

  let query = supabase
    .from("reservations")
    .select("id")
    .eq("room_number", roomNumber)
    .in("status", ["Confirmed", "Checked-In"])
    .lt("check_in_date", checkOut)
    .gt("check_out_date", checkIn);

  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error("Failed to check room availability:", error.message);
    return { isAvailable: false, error: "Could not verify room availability." };
  }

  return { isAvailable: (data ?? []).length === 0, error: null };
}

export interface RoomCategoryFormInput {
  name: string;
  nightly_rate: number;
  amenities: string;
  description: string;
  max_adults: number;
  max_children: number;
  cover_photo_url: string | null;
}

export async function createRoomCategory(
  input: RoomCategoryFormInput,
): Promise<{ data: RoomCategory | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Database connection is not configured." };
  }

  const { data, error } = await supabase
    .from("room_categories")
    .insert({
      ...input,
      is_archived: false,
      is_unavailable: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create room category:", error.message);
    return { data: null, error: "Could not create this category. Please try again." };
  }

  return { data, error: null };
}

export async function updateRoomCategory(
  id: string,
  input: RoomCategoryFormInput,
): Promise<{ data: RoomCategory | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Database connection is not configured." };
  }

  const { data, error } = await supabase
    .from("room_categories")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update room category:", error.message);
    return { data: null, error: "Could not save these changes. Please try again." };
  }

  return { data, error: null };
}

// Soft-delete only, per the Blueprint's recycle-bin pattern (Section 5.1) —
// an archived category still exists for historical reservations/receipts
// that reference it, it's just excluded from every "sellable" listing
// (loadRoomCategories({ sellableOnly: true }), the guest site, RoomRatesPanel).
export async function setRoomCategoryArchived(
  id: string,
  isArchived: boolean,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Database connection is not configured." };
  }

  const { error } = await supabase
    .from("room_categories")
    .update({ is_archived: isArchived })
    .eq("id", id);

  if (error) {
    console.error("Failed to update category archive state:", error.message);
    return { error: "Could not save this change. Please try again." };
  }

  return { error: null };
}

export async function createPhysicalRoom(input: {
  room_number: string;
  floor: number;
  category_id: string;
}): Promise<{ data: PhysicalRoom | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Database connection is not configured." };
  }

  const { data: existing } = await supabase
    .from("physical_rooms")
    .select("id")
    .eq("room_number", input.room_number)
    .maybeSingle();

  if (existing) {
    return { data: null, error: `Room ${input.room_number} already exists.` };
  }

  const { data, error } = await supabase
    .from("physical_rooms")
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error("Failed to create physical room:", error.message);
    return { data: null, error: "Could not add this room. Please try again." };
  }

  return { data, error: null };
}

export async function reassignPhysicalRoomCategory(
  id: string,
  categoryId: string,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Database connection is not configured." };
  }

  const { error } = await supabase
    .from("physical_rooms")
    .update({ category_id: categoryId })
    .eq("id", id);

  if (error) {
    console.error("Failed to reassign room category:", error.message);
    return { error: "Could not save this change. Please try again." };
  }

  return { error: null };
}

// Hard delete is safe here — reservations reference room_number by plain
// text, not a foreign key, so historical bookings are never affected. The
// caller is still expected to block deletion while an active (Confirmed /
// Checked-In) reservation exists against this room, via
// hasActiveReservation() below, so a live stay is never orphaned.
export async function hasActiveReservation(
  roomNumber: string,
): Promise<{ hasActive: boolean; error: string | null }> {
  if (!supabase) {
    return { hasActive: false, error: "Database connection is not configured." };
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("id")
    .eq("room_number", roomNumber)
    .in("status", ["Confirmed", "Checked-In"])
    .limit(1);

  if (error) {
    console.error("Failed to check active reservations:", error.message);
    return { hasActive: false, error: "Could not verify this room's booking status." };
  }

  return { hasActive: (data ?? []).length > 0, error: null };
}

export async function deletePhysicalRoom(id: string): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Database connection is not configured." };
  }

  const { error } = await supabase.from("physical_rooms").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete physical room:", error.message);
    return { error: "Could not remove this room. Please try again." };
  }

  return { error: null };
}
