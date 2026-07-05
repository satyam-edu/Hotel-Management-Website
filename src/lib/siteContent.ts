import { supabase } from "./supabase";
import type { SiteContent } from "../types/database";

export async function loadSiteContent(): Promise<{
  data: SiteContent | null;
  error: string | null;
}> {
  if (!supabase) {
    return { data: null, error: "Database connection is not configured." };
  }

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load site content:", error.message);
    return { data: null, error: "Could not load site content." };
  }

  return { data: data ?? null, error: null };
}
