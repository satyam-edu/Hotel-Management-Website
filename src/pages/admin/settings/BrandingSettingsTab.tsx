import { Palette } from "lucide-react";

export function BrandingSettingsTab() {
  return (
    <div className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Palette size={20} className="text-primary" />
        <h2 className="font-display text-xl font-semibold text-white">
          Branding &amp; Settings
        </h2>
      </div>
      <p className="mt-3 max-w-xl text-sm text-white/60">
        Live color theme pickers for the accent and background tokens, hero
        and about-page image uploads, the room category manager, and the
        physical room mapper will live here. Coming soon.
      </p>
    </div>
  );
}
