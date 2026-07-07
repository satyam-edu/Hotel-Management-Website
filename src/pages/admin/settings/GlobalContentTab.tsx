import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, FileText, ShieldAlert } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { logAction } from "../../../lib/audit";
import { loadSiteContent } from "../../../lib/siteContent";
import { supabase } from "../../../lib/supabase";
import type { SiteContent } from "../../../types/database";

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary disabled:opacity-50";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

type FormState = Omit<SiteContent, "id" | "updated_at">;

// Grouped by guest-facing section rather than logged per-field, so a save
// touching all three Hero inputs writes one "Updated Hero section" entry
// instead of three near-duplicate lines — matches the Blueprint's "targeted
// area reference" convention for text-block content changes.
const CONTENT_SECTIONS: { label: string; fields: (keyof FormState)[] }[] = [
  { label: "Hero", fields: ["hero_title", "hero_subtitle", "hero_cta"] },
  { label: "About Us", fields: ["about_history", "about_philosophy"] },
  { label: "Rooms & Gallery", fields: ["rooms_intro", "gallery_header"] },
  { label: "Reviews", fields: ["featured_review"] },
];

const EMPTY_FORM: FormState = {
  hero_title: "",
  hero_subtitle: "",
  hero_cta: "",
  about_history: "",
  about_philosophy: "",
  rooms_intro: "",
  gallery_header: "",
  featured_review: "",
};

export function GlobalContentTab() {
  const { role, user } = useAuth();
  const canEdit = role === "master_admin" || role === "head_admin";

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loadedContent, setLoadedContent] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function reload() {
    setIsLoading(true);
    const result = await loadSiteContent();
    if (result.data) {
      const { id: _id, updated_at: _updatedAt, ...rest } = result.data;
      setForm(rest);
      setLoadedContent(rest);
    }
    setLoadError(result.error);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    setIsSaving(true);
    setSaveError(null);
    setShowSuccess(false);

    const { error } = await supabase
      .from("site_content")
      .update(form)
      .eq("id", 1);

    if (error) {
      console.error("Failed to save site content:", error.message);
      setSaveError("Could not save site content. Please try again.");
      setIsSaving(false);
      return;
    }

    if (user) {
      for (const section of CONTENT_SECTIONS) {
        const sectionChanged = section.fields.some(
          (field) => loadedContent[field] !== form[field],
        );
        if (sectionChanged) {
          await logAction(
            user.id,
            "update_site_content",
            `Updated ${section.label} section text content fields.`,
          );
        }
      }
    }

    await reload();
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }

  if (isLoading) {
    return (
      <div className="glass-panel flex items-center justify-center gap-3 rounded-xl p-10 text-sm text-white/40">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
        Loading site content…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="glass-panel rounded-xl p-10 text-center text-sm text-red-400" role="alert">
        {loadError}
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="glass-panel flex items-center gap-3 rounded-xl p-6 text-sm text-white/60">
        <ShieldAlert size={18} className="shrink-0 text-amber-400" />
        You do not have permission to edit site content.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <FileText size={20} className="text-primary" />
        <h2 className="font-display text-xl font-semibold text-white">
          Global Content
        </h2>
      </div>
      <p className="mt-2 text-sm text-white/60">
        Every editable guest-facing string on the homepage. Saving applies
        immediately to the live site.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
            Hero
          </h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="heroTitle" className={labelClasses}>
                Hero Title
              </label>
              <input
                id="heroTitle"
                type="text"
                disabled={isSaving}
                value={form.hero_title}
                onChange={(e) => updateField("hero_title", e.target.value)}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="heroCta" className={labelClasses}>
                Hero Call-to-Action
              </label>
              <input
                id="heroCta"
                type="text"
                disabled={isSaving}
                value={form.hero_cta}
                onChange={(e) => updateField("hero_cta", e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="heroSubtitle" className={labelClasses}>
                Hero Subtitle
              </label>
              <textarea
                id="heroSubtitle"
                rows={2}
                disabled={isSaving}
                value={form.hero_subtitle}
                onChange={(e) => updateField("hero_subtitle", e.target.value)}
                className={`${inputClasses} resize-none`}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
            About
          </h3>
          <div className="mt-4 grid gap-5">
            <div>
              <label htmlFor="aboutHistory" className={labelClasses}>
                History Paragraph
              </label>
              <textarea
                id="aboutHistory"
                rows={4}
                disabled={isSaving}
                value={form.about_history}
                onChange={(e) => updateField("about_history", e.target.value)}
                className={`${inputClasses} resize-none`}
              />
            </div>
            <div>
              <label htmlFor="aboutPhilosophy" className={labelClasses}>
                Philosophy Paragraph
              </label>
              <textarea
                id="aboutPhilosophy"
                rows={4}
                disabled={isSaving}
                value={form.about_philosophy}
                onChange={(e) => updateField("about_philosophy", e.target.value)}
                className={`${inputClasses} resize-none`}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
            Rooms &amp; Gallery
          </h3>
          <div className="mt-4 grid gap-5">
            <div>
              <label htmlFor="roomsIntro" className={labelClasses}>
                Rooms Introduction
              </label>
              <textarea
                id="roomsIntro"
                rows={2}
                disabled={isSaving}
                value={form.rooms_intro}
                onChange={(e) => updateField("rooms_intro", e.target.value)}
                className={`${inputClasses} resize-none`}
              />
            </div>
            <div>
              <label htmlFor="galleryHeader" className={labelClasses}>
                Gallery Header
              </label>
              <input
                id="galleryHeader"
                type="text"
                disabled={isSaving}
                value={form.gallery_header}
                onChange={(e) => updateField("gallery_header", e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
            Reviews
          </h3>
          <div className="mt-4">
            <label htmlFor="featuredReview" className={labelClasses}>
              Featured Review Quote
            </label>
            <textarea
              id="featuredReview"
              rows={3}
              disabled={isSaving}
              value={form.featured_review}
              onChange={(e) => updateField("featured_review", e.target.value)}
              className={`${inputClasses} resize-none`}
            />
          </div>
        </div>
      </div>

      {saveError && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {saveError}
        </p>
      )}

      <div className="mt-7 flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-sm bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save Global Content"}
        </button>

        {showSuccess && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 size={16} />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
