import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Palette,
  Power,
  Receipt,
  ShieldAlert,
} from "lucide-react";
import { ImageDropzone } from "../../../components/ui/ImageDropzone";
import { useAuth } from "../../../context/AuthContext";
import { useSystemContext } from "../../../context/SystemContext";
import { logAction } from "../../../lib/audit";
import { logConfigDiff } from "../../../lib/auditDiff";
import { supabase } from "../../../lib/supabase";
import { GalleryManager } from "./GalleryManager";
import { PhysicalRoomMapper } from "./PhysicalRoomMapper";
import { RoomCategoryManager } from "./RoomCategoryManager";

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary disabled:opacity-50";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

interface InvoiceFormState {
  taxRate: string;
  taxId: string;
  invoiceTerms: string;
}

interface ThemeFormState {
  primaryGold: string;
  bgCharcoal: string;
  maintenanceMode: boolean;
}

function ThemeAndMaintenanceForm({ canEdit }: { canEdit: boolean }) {
  const { user } = useAuth();
  const { config, refresh } = useSystemContext();

  const [form, setForm] = useState<ThemeFormState>({
    primaryGold: config.primary_gold,
    bgCharcoal: config.bg_charcoal,
    maintenanceMode: config.maintenance_mode,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function saveUploadedAsset(
    update: { hero_bg_url: string } | { about_photo_url: string },
    label: string,
    file: File,
  ) {
    if (!supabase) return;
    setUploadError(null);

    const { error } = await supabase
      .from("system_configurations")
      .update(update)
      .eq("id", 1);

    if (error) {
      console.error(`Failed to save ${label}:`, error.message);
      setUploadError(`Could not save the uploaded ${label.toLowerCase()}. Please try again.`);
      return;
    }

    if (user) {
      await logAction(
        user.id,
        "upload_asset",
        `Uploaded new ${label.toLowerCase()} photograph: ${file.name}.`,
      );
    }

    await refresh();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    setIsSaving(true);
    setSaveError(null);
    setShowSuccess(false);

    const previousMaintenanceMode = config.maintenance_mode;

    const { error } = await supabase
      .from("system_configurations")
      .update({
        primary_gold: form.primaryGold,
        bg_charcoal: form.bgCharcoal,
        maintenance_mode: form.maintenanceMode,
      })
      .eq("id", 1);

    if (error) {
      console.error("Failed to save theme settings:", error.message);
      setSaveError("Could not save theme settings. Please try again.");
      setIsSaving(false);
      return;
    }

    if (user) {
      // Explicit hex-value logging for token changes, kept distinct from the
      // kill switch, which is logged as a state transition rather than an
      // "old value → new value" pair.
      if (config.primary_gold !== form.primaryGold) {
        await logAction(
          user.id,
          "update_branding",
          `Updated primary accent color from ${config.primary_gold} to ${form.primaryGold}.`,
        );
      }
      if (config.bg_charcoal !== form.bgCharcoal) {
        await logAction(
          user.id,
          "update_branding",
          `Updated primary background color from ${config.bg_charcoal} to ${form.bgCharcoal}.`,
        );
      }
      if (previousMaintenanceMode !== form.maintenanceMode) {
        await logAction(
          user.id,
          "toggle_maintenance_mode",
          `System Action: Triggered Maintenance Mode Kill Switch to ${form.maintenanceMode ? "ON" : "OFF"}.`,
        );
      }
    }

    await refresh();
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Palette size={20} className="text-primary" />
        <h2 className="font-display text-xl font-semibold text-white">
          Branding &amp; Settings
        </h2>
      </div>
      <p className="mt-2 text-sm text-white/60">
        The accent and background colors cascade through every derived shade
        across the site instantly. Hero and About photographs upload directly
        and apply to the live site as soon as they finish processing.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <ImageDropzone
          folder="hero"
          currentUrl={config.hero_bg_url}
          label="Hero Background Photograph"
          disabled={!canEdit}
          onUploaded={(url, file) =>
            saveUploadedAsset({ hero_bg_url: url }, "Hero background", file)
          }
        />
        <ImageDropzone
          folder="about"
          currentUrl={config.about_photo_url}
          label="About Section Photograph"
          disabled={!canEdit}
          onUploaded={(url, file) =>
            saveUploadedAsset({ about_photo_url: url }, "About section", file)
          }
        />
      </div>

      {uploadError && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {uploadError}
        </p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="primaryGold" className={labelClasses}>
            Primary Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primaryGold"
              type="color"
              disabled={!canEdit || isSaving}
              value={form.primaryGold}
              onChange={(e) => setForm((f) => ({ ...f, primaryGold: e.target.value }))}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-sm border border-white/10 bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              type="text"
              disabled={!canEdit || isSaving}
              value={form.primaryGold}
              onChange={(e) => setForm((f) => ({ ...f, primaryGold: e.target.value }))}
              className={inputClasses}
            />
          </div>
        </div>

        <div>
          <label htmlFor="bgCharcoal" className={labelClasses}>
            Primary Background Tone
          </label>
          <div className="flex items-center gap-3">
            <input
              id="bgCharcoal"
              type="color"
              disabled={!canEdit || isSaving}
              value={form.bgCharcoal}
              onChange={(e) => setForm((f) => ({ ...f, bgCharcoal: e.target.value }))}
              className="h-10 w-14 shrink-0 cursor-pointer rounded-sm border border-white/10 bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              type="text"
              disabled={!canEdit || isSaving}
              value={form.bgCharcoal}
              onChange={(e) => setForm((f) => ({ ...f, bgCharcoal: e.target.value }))}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-red-400/25 bg-red-400/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Power size={18} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-300">
                Maintenance Mode (Kill Switch)
              </p>
              <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-white/60">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
                Turning this on immediately replaces the entire guest-facing
                site with a temporary closure notice. The admin console
                remains fully accessible so you can turn it back off.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={form.maintenanceMode}
            disabled={!canEdit || isSaving}
            onClick={() =>
              setForm((f) => ({ ...f, maintenanceMode: !f.maintenanceMode }))
            }
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
              form.maintenanceMode ? "bg-red-500" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white transition-transform duration-300 ${
                form.maintenanceMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {form.maintenanceMode && (
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-red-300">
            Site will be marked closed once saved.
          </p>
        )}
      </div>

      {saveError && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {saveError}
        </p>
      )}

      {canEdit && (
        <div className="mt-7 flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-sm bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save Branding & Settings"}
          </button>

          {showSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle2 size={16} />
              Saved
            </span>
          )}
        </div>
      )}
    </form>
  );
}

export function BrandingSettingsTab() {
  const { role, user } = useAuth();
  const { config, refresh } = useSystemContext();
  const canEdit = role === "master_admin" || role === "head_admin";

  const [form, setForm] = useState<InvoiceFormState>({
    taxRate: String(config.tax_rate),
    taxId: config.tax_id,
    invoiceTerms: config.invoice_terms,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    const taxRate = Number(form.taxRate);
    if (Number.isNaN(taxRate) || taxRate < 0) {
      setSaveError("Please enter a valid tax rate.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setShowSuccess(false);

    const previousValues = {
      tax_rate: config.tax_rate,
      tax_id: config.tax_id,
      invoice_terms: config.invoice_terms,
    };
    const nextValues = {
      tax_rate: taxRate,
      tax_id: form.taxId,
      invoice_terms: form.invoiceTerms,
    };

    const { error } = await supabase
      .from("system_configurations")
      .update(nextValues)
      .eq("id", 1);

    if (error) {
      console.error("Failed to save invoice configuration:", error.message);
      setSaveError("Could not save invoice configuration. Please try again.");
      setIsSaving(false);
      return;
    }

    if (user) {
      await logConfigDiff(user.id, "update_invoice_config", previousValues, nextValues, {
        tax_rate: { label: "Tax Rate", kind: "number" },
        tax_id: { label: "Tax ID", kind: "text" },
        invoice_terms: { label: "Invoice Terms", kind: "text" },
      });
    }

    await refresh();
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }

  return (
    <div className="space-y-6">
      <ThemeAndMaintenanceForm canEdit={canEdit} />

      {canEdit && (
        <>
          <GalleryManager />
          <RoomCategoryManager />
          <PhysicalRoomMapper />
        </>
      )}

      {!canEdit ? (
        <div className="glass-panel flex items-center gap-3 rounded-xl p-6 text-sm text-white/60">
          <ShieldAlert size={18} className="shrink-0 text-amber-400" />
          You do not have permission to edit invoice configuration.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Receipt size={20} className="text-primary" />
            <h2 className="font-display text-xl font-semibold text-white">
              Invoice Configuration
            </h2>
          </div>
          <p className="mt-2 text-sm text-white/60">
            Applied to every generated receipt and the ledger's billing
            calculations.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="taxRate" className={labelClasses}>
                Tax Rate (%)
              </label>
              <input
                id="taxRate"
                type="number"
                min={0}
                step="0.01"
                required
                disabled={isSaving}
                value={form.taxRate}
                onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="taxId" className={labelClasses}>
                Tax ID
              </label>
              <input
                id="taxId"
                type="text"
                placeholder="e.g. GSTIN"
                disabled={isSaving}
                value={form.taxId}
                onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                className={inputClasses}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="invoiceTerms" className={labelClasses}>
                Invoice Terms
              </label>
              <textarea
                id="invoiceTerms"
                rows={4}
                disabled={isSaving}
                value={form.invoiceTerms}
                onChange={(e) => setForm((f) => ({ ...f, invoiceTerms: e.target.value }))}
                className={`${inputClasses} resize-none`}
              />
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
              {isSaving ? "Saving…" : "Save Invoice Configuration"}
            </button>

            {showSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 size={16} />
                Saved
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
