import { useEffect, useState } from "react";
import {
  Archive,
  CheckCircle2,
  FolderInput,
  GalleryHorizontalEnd,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { FolderCombobox } from "../../../components/ui/FolderCombobox";
import { ImageDropzone } from "../../../components/ui/ImageDropzone";
import { useAuth } from "../../../context/AuthContext";
import { logAction } from "../../../lib/audit";
import {
  createGalleryImage,
  deleteGalleryImagePermanently,
  loadGalleryImages,
  setGalleryImageArchived,
  sortFoldersByPriority,
  updateGalleryImageFolder,
} from "../../../lib/gallery";
import { supabase } from "../../../lib/supabase";
import type { GalleryImage } from "../../../types/database";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

function slugifyFolderTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function GalleryManager() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [folderTag, setFolderTag] = useState("Rooms");
  const [activeFolder, setActiveFolder] = useState("All");
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [reassigningId, setReassigningId] = useState<string | null>(null);

  async function loadImages() {
    setIsLoading(true);
    const result = await loadGalleryImages();
    setImages(result.data);
    setLoadError(result.error);
    setIsLoading(false);
  }

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("gallery_images_manager")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gallery_images" },
        () => loadImages(),
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  function flashSuccess(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  async function handleUploaded(publicUrl: string, file: File) {
    setActionError(null);
    const tag = slugifyFolderTag(folderTag) || "Uncategorized";

    const result = await createGalleryImage({
      folder_tag: tag,
      image_url: publicUrl,
      alt_text: file.name,
    });

    if (result.error) {
      setActionError(result.error);
      return;
    }

    if (user) {
      await logAction(
        user.id,
        "upload_gallery_image",
        `Uploaded new photograph to the "${tag}" gallery folder: ${file.name}.`,
      );
    }

    flashSuccess(`Image added to "${tag}".`);
    await loadImages();
  }

  async function handleArchiveToggle(image: GalleryImage, archive: boolean) {
    setActionError(null);
    const result = await setGalleryImageArchived(image.id, archive);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    if (user) {
      await logAction(
        user.id,
        archive ? "archive_gallery_image" : "restore_gallery_image",
        `${archive ? "Archived" : "Restored"} gallery photograph in "${image.folder_tag}" (${image.alt_text || "untitled"}).`,
      );
    }
    flashSuccess(archive ? "Image moved to the recycle bin." : "Image restored.");
    await loadImages();
  }

  async function handlePermanentDelete(image: GalleryImage) {
    if (!window.confirm("Permanently delete this image? This cannot be undone.")) return;

    setActionError(null);
    const result = await deleteGalleryImagePermanently(image);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    if (user) {
      await logAction(
        user.id,
        "delete_gallery_image",
        `Permanently deleted gallery photograph from "${image.folder_tag}" (${image.alt_text || "untitled"}).`,
      );
    }
    flashSuccess("Image permanently deleted.");
    await loadImages();
  }

  async function handleFolderReassign(image: GalleryImage, nextFolder: string) {
    setReassigningId(null);
    if (!nextFolder || nextFolder === image.folder_tag) return;

    setActionError(null);
    const result = await updateGalleryImageFolder(image.id, nextFolder);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    if (user) {
      await logAction(
        user.id,
        "update_gallery_image_folder",
        `Moved gallery photograph "${image.alt_text || "untitled"}" from "${image.folder_tag}" to "${nextFolder}".`,
      );
    }
    flashSuccess(`Moved to "${nextFolder}".`);
    await loadImages();
  }

  const activeImages = images.filter((i) => !i.is_archived);
  const archivedImages = images.filter((i) => i.is_archived);
  const folders = sortFoldersByPriority(
    Array.from(new Set(activeImages.map((i) => i.folder_tag))),
  );
  const visibleImages =
    activeFolder === "All"
      ? activeImages
      : activeImages.filter((img) => img.folder_tag === activeFolder);

  return (
    <div className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <GalleryHorizontalEnd size={20} className="text-primary" />
        <h2 className="font-display text-xl font-semibold text-white">
          Photo Gallery
        </h2>
      </div>
      <p className="mt-2 text-sm text-white/60">
        Organize photographs into named folders. Guests see a filter button
        for every active folder on the homepage gallery.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="folderTag" className={labelClasses}>
            Folder
          </label>
          <FolderCombobox
            id="folderTag"
            value={folderTag}
            options={folders}
            onChange={setFolderTag}
            placeholder="e.g. Rooms, Banquets, Outdoor Lawn"
          />
        </div>

        <div>
          <ImageDropzone
            folder={`gallery/${slugifyFolderTag(folderTag) || "uncategorized"}`}
            currentUrl={null}
            label="Upload to this folder"
            onUploaded={handleUploaded}
          />
        </div>
      </div>

      {actionError && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}
      {successMessage && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-emerald-400">
          <CheckCircle2 size={16} />
          {successMessage}
        </p>
      )}

      {isLoading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-sm border border-white/10 p-8 text-sm text-white/40">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
          Loading gallery…
        </div>
      )}

      {!isLoading && loadError && (
        <p className="mt-6 text-sm text-red-400" role="alert">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && activeImages.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {["All", ...folders].map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => {
                setActiveFolder(folder);
                setReassigningId(null); // Force close any open menus when changing tabs
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs uppercase tracking-wider transition-colors duration-300 ${
                activeFolder === folder
                  ? "bg-primary text-background-dark"
                  : "border border-white/10 text-white/60 hover:text-white"
              }`}
            >
              {folder}
            </button>
          ))}
        </div>
      )}

      {!isLoading && !loadError && (
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {visibleImages.map((image) => (
            <div
              key={image.id}
              onMouseLeave={() => setReassigningId((current) => (current === image.id ? null : current))}
              className="group relative aspect-square w-full max-w-[110px] overflow-hidden rounded-lg border border-slate-800 bg-[#0c1322]"
            >
              <img
                src={image.image_url}
                alt={image.alt_text}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Move to another folder"
                  onClick={() => setReassigningId(reassigningId === image.id ? null : image.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/90 text-slate-200 shadow-lg transition-all hover:bg-slate-800 hover:text-white"
                >
                  <FolderInput size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Archive image"
                  onClick={() => handleArchiveToggle(image, true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/90 text-slate-200 shadow-lg transition-all hover:bg-red-400/30 hover:text-red-200"
                >
                  <Archive size={20} />
                </button>
              </div>

              {reassigningId === image.id && (
                <div className="absolute inset-x-1 bottom-1 z-10 max-h-24 overflow-y-auto rounded-sm border border-white/10 bg-background-dark shadow-xl">
                  {folders
                    .filter((folder) => folder !== image.folder_tag)
                    .map((folder) => (
                      <button
                        key={folder}
                        type="button"
                        onClick={() => handleFolderReassign(image, folder)}
                        className="block w-full truncate px-2 py-1 text-left text-[10px] text-white/70 transition-colors duration-300 hover:bg-primary/10 hover:text-primary"
                      >
                        {folder}
                      </button>
                    ))}
                  {folders.filter((folder) => folder !== image.folder_tag).length === 0 && (
                    <p className="px-2 py-1 text-[10px] text-white/40">No other folders yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {activeImages.length === 0 && (
            <p className="col-span-full rounded-sm border border-white/10 p-6 text-center text-sm text-white/40">
              No gallery images yet.
            </p>
          )}

          {activeImages.length > 0 && visibleImages.length === 0 && (
            <p className="col-span-full rounded-sm border border-white/10 p-6 text-center text-sm text-white/40">
              No images in "{activeFolder}" yet.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => setShowRecycleBin((v) => !v)}
          className="text-xs uppercase tracking-widest text-white/40 transition-colors duration-300 hover:text-white/70"
        >
          {showRecycleBin ? "Hide" : "Show"} Recycle Bin ({archivedImages.length})
        </button>

        {showRecycleBin && (
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {archivedImages.length === 0 && (
              <p className="col-span-full text-sm text-white/40">No archived images.</p>
            )}
            {archivedImages.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square w-full max-w-[110px] overflow-hidden rounded-lg border border-slate-800 bg-[#0c1322] opacity-60"
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Restore image"
                    onClick={() => handleArchiveToggle(image, false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/90 text-primary shadow-lg transition-all hover:bg-slate-800 hover:text-white"
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete permanently"
                    onClick={() => handlePermanentDelete(image)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/90 text-red-400/80 shadow-lg transition-all hover:bg-red-500/30 hover:text-red-300"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
