import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { uploadHotelAsset } from "../../lib/storage";

interface ImageDropzoneProps {
  folder: string;
  currentUrl: string | null;
  fallbackUrl?: string;
  label: string;
  disabled?: boolean;
  onUploaded: (publicUrl: string, file: File) => void;
}

export function ImageDropzone({
  folder,
  currentUrl,
  fallbackUrl,
  label,
  disabled,
  onUploaded,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = currentUrl || fallbackUrl || null;

  async function handleFile(file: File | undefined) {
    if (!file || disabled) return;

    setIsUploading(true);
    setError(null);

    const { publicUrl, error: uploadError } = await uploadHotelAsset(folder, file);

    if (uploadError || !publicUrl) {
      setError(uploadError ?? "Upload failed. Please try again.");
      setIsUploading(false);
      return;
    }

    onUploaded(publicUrl, file);
    setIsUploading(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFile(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <p className="mb-1.5 block text-xs tracking-wide text-white/50">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload ${label}`}
        className={`relative flex h-36 w-full max-h-40 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-sm border-2 border-dashed transition-colors duration-300 ${
          isDragging ? "border-primary bg-primary/5" : "border-white/15 bg-white/[0.03]"
        } ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50"}`}
      >
        {previewUrl && (
          <img
            src={previewUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div
          className={`relative z-10 flex flex-col items-center gap-1.5 rounded-sm px-3 py-2 text-center ${
            previewUrl ? "bg-black/60 backdrop-blur-sm" : ""
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin text-primary" />
              <span className="text-[11px] text-white/70">Uploading…</span>
            </>
          ) : previewUrl ? (
            <>
              <ImagePlus size={14} className="text-white/80" />
              <span className="text-[11px] leading-tight text-white/80">
                Drop or click to replace
              </span>
            </>
          ) : (
            <>
              <UploadCloud size={16} className="text-white/50" />
              <span className="text-[11px] leading-tight text-white/50">
                Drag &amp; drop, or click to browse
              </span>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={disabled || isUploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
