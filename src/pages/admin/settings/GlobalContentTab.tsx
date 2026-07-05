import { FileText } from "lucide-react";

export function GlobalContentTab() {
  return (
    <div className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <FileText size={20} className="text-primary" />
        <h2 className="font-display text-xl font-semibold text-white">
          Global Content
        </h2>
      </div>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        Editable guest-facing copy — the hero heading and tagline, about-page
        paragraphs, the rooms introduction, the gallery header, and the
        featured review quote — will live here. Coming soon.
      </p>
    </div>
  );
}
