import { supabase } from "./supabase";

const BUCKET = "hotel-assets";
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadHotelAsset(
  folder: string,
  file: File,
): Promise<{ publicUrl: string | null; error: string | null }> {
  if (!supabase) {
    return { publicUrl: null, error: "Database connection is not configured." };
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { publicUrl: null, error: "Please upload a JPEG, PNG, WebP, or AVIF image." };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { publicUrl: null, error: "Image must be smaller than 8MB." };
  }

  const path = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    console.error("Failed to upload image:", error.message);
    return { publicUrl: null, error: "Could not upload this image. Please try again." };
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return { publicUrl: publicUrlData.publicUrl, error: null };
}
