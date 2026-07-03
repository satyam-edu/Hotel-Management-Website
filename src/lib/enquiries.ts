import { supabase } from "./supabase";
import type { Enquiry } from "../types/database";

const REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateEnquiryReference(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += REFERENCE_CHARS[Math.floor(Math.random() * REFERENCE_CHARS.length)];
  }
  return `ENQ-${code}`;
}

export type PendingEnquiry = Enquiry & {
  room_type_name: string | null;
};

export async function loadPendingEnquiries(): Promise<{
  data: PendingEnquiry[];
  error: string | null;
}> {
  if (!supabase) {
    return { data: [], error: "Database connection is not configured." };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select("*, room_categories(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load enquiries:", error.message);
    return { data: [], error: "Could not load pending enquiries." };
  }

  const enquiries = (data ?? []).map((row) => {
    const { room_categories, ...enquiry } = row as Enquiry & {
      room_categories: { name: string } | null;
    };
    return {
      ...enquiry,
      room_type_name: room_categories?.name ?? null,
    };
  });

  return { data: enquiries, error: null };
}
