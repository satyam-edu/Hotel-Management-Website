import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  BedDouble,
  CheckCircle2,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { logAction } from "../../../lib/audit";
import {
  createRoomCategory,
  loadRoomCategories,
  setRoomCategoryArchived,
  updateRoomCategory,
  type RoomCategoryFormInput,
} from "../../../lib/rooms";
import { supabase } from "../../../lib/supabase";
import type { RoomCategory } from "../../../types/database";

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary disabled:opacity-50";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

const EMPTY_FORM: RoomCategoryFormInput = {
  name: "",
  nightly_rate: 0,
  amenities: "",
  description: "",
  max_adults: 2,
  max_children: 2,
};

function parseAmenityTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

interface CategoryFormProps {
  initial: RoomCategoryFormInput;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (input: RoomCategoryFormInput) => Promise<void>;
}

function CategoryForm({ initial, submitLabel, onCancel, onSubmit }: CategoryFormProps) {
  const [form, setForm] = useState<RoomCategoryFormInput>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof RoomCategoryFormInput>(
    field: K,
    value: RoomCategoryFormInput[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (form.nightly_rate <= 0) {
      setError("Nightly rate must be greater than zero.");
      return;
    }

    setIsSaving(true);
    setError(null);
    await onSubmit(form);
    setIsSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-sm border border-white/10 bg-white/[0.03] p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="categoryName" className={labelClasses}>
            Category Name
          </label>
          <input
            id="categoryName"
            type="text"
            required
            disabled={isSaving}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Deluxe"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="categoryRate" className={labelClasses}>
            Base Nightly Rate (₹)
          </label>
          <input
            id="categoryRate"
            type="number"
            min={0}
            step="1"
            required
            disabled={isSaving}
            value={form.nightly_rate}
            onChange={(e) => updateField("nightly_rate", Number(e.target.value))}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="categoryMaxAdults" className={labelClasses}>
            Max Adults
          </label>
          <input
            id="categoryMaxAdults"
            type="number"
            min={1}
            required
            disabled={isSaving}
            value={form.max_adults}
            onChange={(e) => updateField("max_adults", Number(e.target.value))}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="categoryMaxChildren" className={labelClasses}>
            Max Children
          </label>
          <input
            id="categoryMaxChildren"
            type="number"
            min={0}
            required
            disabled={isSaving}
            value={form.max_children}
            onChange={(e) => updateField("max_children", Number(e.target.value))}
            className={inputClasses}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="categoryDescription" className={labelClasses}>
            Description
          </label>
          <textarea
            id="categoryDescription"
            rows={2}
            disabled={isSaving}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="A short guest-facing description of this room tier…"
            className={`${inputClasses} resize-none`}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="categoryAmenities" className={labelClasses}>
            Amenities (comma-separated)
          </label>
          <input
            id="categoryAmenities"
            type="text"
            disabled={isSaving}
            value={form.amenities}
            onChange={(e) => updateField("amenities", e.target.value)}
            placeholder="Free Wi-Fi, Air Conditioning, King Bed"
            className={inputClasses}
          />
          {form.amenities && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parseAmenityTags(form.amenities).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-sm bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-sm border border-white/15 px-4 py-2.5 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function RoomCategoryManager() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  async function loadCategories() {
    setIsLoading(true);
    const result = await loadRoomCategories();
    setCategories(result.data);
    setLoadError(result.error);
    setIsLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("room_categories_manager")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_categories" },
        () => loadCategories(),
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

  async function handleCreate(input: RoomCategoryFormInput) {
    setActionError(null);
    const result = await createRoomCategory(input);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    if (user) {
      await logAction(
        user.id,
        "create_category",
        `Created new room tier: ${input.name} with base rate of ₹${input.nightly_rate.toLocaleString("en-IN")}.`,
      );
    }
    setIsAddingNew(false);
    flashSuccess(`"${input.name}" category created.`);
    await loadCategories();
  }

  async function handleEdit(id: string, input: RoomCategoryFormInput) {
    setActionError(null);
    const result = await updateRoomCategory(id, input);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    if (user) {
      await logAction(user.id, "edit_category", `Edited room category "${input.name}".`);
    }
    setEditingId(null);
    flashSuccess(`"${input.name}" category updated.`);
    await loadCategories();
  }

  async function handleArchiveToggle(category: RoomCategory, archive: boolean) {
    setActionError(null);
    const result = await setRoomCategoryArchived(category.id, archive);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    if (user) {
      await logAction(
        user.id,
        archive ? "archive_category" : "restore_category",
        `${archive ? "Archived" : "Restored"} room category "${category.name}".`,
      );
    }
    flashSuccess(archive ? `"${category.name}" moved to the recycle bin.` : `"${category.name}" restored.`);
    await loadCategories();
  }

  const activeCategories = categories.filter((c) => !c.is_archived);
  const archivedCategories = categories.filter((c) => c.is_archived);

  return (
    <div className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BedDouble size={20} className="text-primary" />
          <h2 className="font-display text-xl font-semibold text-white">
            Room Categories
          </h2>
        </div>
        {!isAddingNew && (
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-background-dark transition-opacity duration-300 hover:opacity-90"
          >
            <Plus size={14} />
            Add Category
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-white/60">
        The room tiers guests see on the homepage and staff assign physical
        rooms to below.
      </p>

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

      {isAddingNew &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex h-screen w-screen min-h-screen items-center justify-center bg-black/80 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-background-dark p-8 shadow-2xl sm:p-10">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-semibold text-white">
                  Add Category
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  aria-label="Close"
                  className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/80"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-6">
                <CategoryForm
                  initial={EMPTY_FORM}
                  submitLabel="Create Category"
                  onCancel={() => setIsAddingNew(false)}
                  onSubmit={handleCreate}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isLoading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-sm border border-white/10 p-8 text-sm text-white/40">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
          Loading categories…
        </div>
      )}

      {!isLoading && loadError && (
        <p className="mt-6 text-sm text-red-400" role="alert">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && (
        <div className="mt-6 space-y-3">
          {activeCategories.map((category) =>
            editingId === category.id ? (
              <CategoryForm
                key={category.id}
                initial={{
                  name: category.name,
                  nightly_rate: category.nightly_rate,
                  amenities: category.amenities,
                  description: category.description,
                  max_adults: category.max_adults,
                  max_children: category.max_children,
                }}
                submitLabel="Save Changes"
                onCancel={() => setEditingId(null)}
                onSubmit={(input) => handleEdit(category.id, input)}
              />
            ) : (
              <div
                key={category.id}
                className="grid gap-3 rounded-sm border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
              >
                <div>
                  <p className="font-display text-base font-semibold text-white">
                    {category.name}
                  </p>
                  {category.description && (
                    <p className="mt-1 text-xs text-white/50">{category.description}</p>
                  )}
                </div>
                <div className="text-sm text-white/70">
                  ₹{category.nightly_rate.toLocaleString("en-IN")} / night
                </div>
                <div className="text-sm text-white/70">
                  {category.max_adults} Adults · {category.max_children} Children
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Edit ${category.name}`}
                    onClick={() => {
                      setEditingId(category.id);
                      setIsAddingNew(false);
                    }}
                    className="rounded-sm p-2 text-white/50 transition-colors duration-300 hover:bg-white/5 hover:text-white"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Archive ${category.name}`}
                    onClick={() => handleArchiveToggle(category, true)}
                    className="rounded-sm p-2 text-white/50 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-400"
                  >
                    <Archive size={16} />
                  </button>
                </div>
              </div>
            ),
          )}

          {activeCategories.length === 0 && (
            <p className="rounded-sm border border-white/10 p-6 text-center text-sm text-white/40">
              No active room categories yet.
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
          {showRecycleBin ? "Hide" : "Show"} Recycle Bin ({archivedCategories.length})
        </button>

        {showRecycleBin && (
          <div className="mt-4 space-y-2">
            {archivedCategories.length === 0 && (
              <p className="text-sm text-white/40">No archived categories.</p>
            )}
            {archivedCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-white/10 bg-white/[0.02] p-3"
              >
                <span className="text-sm text-white/60">{category.name}</span>
                <button
                  type="button"
                  onClick={() => handleArchiveToggle(category, false)}
                  className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition-colors duration-300 hover:bg-primary/10"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
