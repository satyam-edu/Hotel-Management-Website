import { supabase } from "./supabase";
import type { GalleryImage } from "../types/database";

const BUCKET = "hotel-assets";

// Section 1.6: the property's actual revenue-driving folders (Rooms, then
// event/banquet space) should lead the filter row regardless of upload
// order, rather than an alphabetical sort putting "Banquets" ahead of
// "Rooms" by accident. Shared by both the admin Gallery Manager and the
// public GallerySection so the two never drift into different orderings.
const CATEGORY_PRIORITY = ["rooms", "outdoor", "banquets", "dining", "events", "amenities"];

export function sortFoldersByPriority(folders: string[]): string[] {
  return [...folders].sort((a, b) => {
    const indexA = CATEGORY_PRIORITY.indexOf(a.toLowerCase());
    const indexB = CATEGORY_PRIORITY.indexOf(b.toLowerCase());

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
}

// Supabase's getPublicUrl() shape is always
// ".../storage/v1/object/public/<bucket>/<path>" — this recovers <path> so
// the object can be targeted for storage.remove() using only the row's
// stored image_url, with no separate storage-path column to keep in sync.
function extractStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export async function loadGalleryImages(
  options: { activeOnly?: boolean } = {},
): Promise<{ data: GalleryImage[]; error: string | null }> {
  if (!supabase) {
    return { data: [], error: "Database connection is not configured." };
  }

  let query = supabase.from("gallery_images").select("*");

  if (options.activeOnly) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load gallery images:", error.message);
    return { data: [], error: "Could not load gallery images." };
  }

  return { data: data ?? [], error: null };
}

export async function createGalleryImage(input: {
  folder_tag: string;
  image_url: string;
  alt_text: string;
}): Promise<{ data: GalleryImage | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Database connection is not configured." };
  }

  const { data, error } = await supabase
    .from("gallery_images")
    .insert({ ...input, is_archived: false })
    .select()
    .single();

  if (error) {
    console.error("Failed to save gallery image:", error.message);
    return { data: null, error: "Could not save this image. Please try again." };
  }

  return { data, error: null };
}

export async function setGalleryImageArchived(
  id: string,
  isArchived: boolean,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Database connection is not configured." };
  }

  const { error } = await supabase
    .from("gallery_images")
    .update({ is_archived: isArchived })
    .eq("id", id);

  if (error) {
    console.error("Failed to update gallery image archive state:", error.message);
    return { error: "Could not save this change. Please try again." };
  }

  return { error: null };
}

// Permanent purge: unlike setGalleryImageArchived (soft-delete/recycle bin),
// this removes the row AND the underlying storage object — irreversible, so
// this only ever runs from the recycle bin, never the active grid.
export async function deleteGalleryImagePermanently(
  image: GalleryImage,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Database connection is not configured." };
  }

  const storagePath = extractStoragePath(image.image_url);
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (storageError) {
      console.error("Failed to remove gallery image from storage:", storageError.message);
    }
  }

  const { error } = await supabase.from("gallery_images").delete().eq("id", image.id);

  if (error) {
    console.error("Failed to delete gallery image row:", error.message);
    return { error: "Could not permanently delete this image. Please try again." };
  }

  return { error: null };
}

export async function updateGalleryImageFolder(
  id: string,
  folderTag: string,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Database connection is not configured." };
  }

  const { error } = await supabase
    .from("gallery_images")
    .update({ folder_tag: folderTag })
    .eq("id", id);

  if (error) {
    console.error("Failed to reassign gallery image folder:", error.message);
    return { error: "Could not move this image. Please try again." };
  }

  return { error: null };
}
