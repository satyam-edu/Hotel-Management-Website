import { useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { loadRoomCategories } from "../../lib/rooms";
import { logAction } from "../../lib/audit";
import type { RoomCategory } from "../../types/database";

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function RoomRatesPanel() {
  const { role, user } = useAuth();
  const canEdit = role === "master_admin" || role === "head_admin";

  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});

  async function loadCategories() {
    setIsLoading(true);
    setLoadError(null);

    const result = await loadRoomCategories();

    if (result.error) {
      setLoadError(result.error);
      setIsLoading(false);
      return;
    }

    setCategories(result.data);
    setRateDrafts(
      Object.fromEntries(
        result.data.map((category) => [category.id, String(category.nightly_rate)]),
      ),
    );
    setIsLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("room_categories_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_categories" },
        () => {
          loadCategories();
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  async function handleRateSave(category: RoomCategory) {
    if (!supabase || !canEdit) return;

    const draft = rateDrafts[category.id];
    const nextRate = Number(draft);

    if (!draft || Number.isNaN(nextRate) || nextRate < 0) {
      setActionError("Enter a valid nightly rate.");
      return;
    }

    if (nextRate === category.nightly_rate) return;

    setSavingId(category.id);
    setActionError(null);

    const { error } = await supabase
      .from("room_categories")
      .update({ nightly_rate: nextRate })
      .eq("id", category.id);

    if (error) {
      setSavingId(null);
      console.error("Failed to update nightly rate:", error.message);
      setActionError("Could not save the new rate. Please try again.");
      return;
    }

    if (user) {
      await logAction(
        user.id,
        "update_rates",
        `Updated ${category.name} nightly rate from ${formatCurrency(category.nightly_rate)} to ${formatCurrency(nextRate)}`,
      );
    }

    setSavingId(null);
    await loadCategories();
  }

  async function handleAvailabilityToggle(category: RoomCategory) {
    if (!supabase || !canEdit) return;

    setSavingId(category.id);
    setActionError(null);

    const nextUnavailable = !category.is_unavailable;

    const { error } = await supabase
      .from("room_categories")
      .update({ is_unavailable: nextUnavailable })
      .eq("id", category.id);

    if (error) {
      setSavingId(null);
      console.error("Failed to update availability:", error.message);
      setActionError("Could not update availability. Please try again.");
      return;
    }

    if (user) {
      await logAction(
        user.id,
        "update_availability",
        `Marked ${category.name} as ${nextUnavailable ? "Unavailable" : "Available"}`,
      );
    }

    setSavingId(null);
    await loadCategories();
  }

  const activeCategories = categories.filter((category) => !category.is_archived);

  return (
    <div className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-white">
            <IndianRupee size={18} className="text-primary" />
            Room Rates &amp; Inventory
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Nightly rates and live availability for every active room category.
          </p>
        </div>

        {!canEdit && (
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wider text-white/50">
            Read-only
          </span>
        )}
      </div>

      {actionError && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}

      <div className="mt-6 w-full overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[560px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[30%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="whitespace-nowrap py-3 pr-4 font-medium">Category</th>
              <th className="whitespace-nowrap py-3 pr-4 font-medium">Nightly Rate</th>
              <th className="whitespace-nowrap py-3 pr-4 font-medium">Availability</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="py-8">
                  <div className="flex items-center justify-center gap-3 text-sm text-white/40">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
                    Loading room categories…
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && loadError && (
              <tr>
                <td
                  colSpan={3}
                  className="py-8 text-center text-sm text-red-400"
                  role="alert"
                >
                  {loadError}
                </td>
              </tr>
            )}

            {!isLoading &&
              !loadError &&
              activeCategories.map((category) => (
                <tr key={category.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4 text-white/90">{category.name}</td>
                  <td className="py-3 pr-4">
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <span className="text-white/50">₹</span>
                        <input
                          type="number"
                          min={0}
                          disabled={savingId === category.id}
                          value={rateDrafts[category.id] ?? ""}
                          onChange={(e) =>
                            setRateDrafts((prev) => ({
                              ...prev,
                              [category.id]: e.target.value,
                            }))
                          }
                          onBlur={() => handleRateSave(category)}
                          className="w-28 rounded-sm border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-white outline-none transition-colors duration-300 focus:border-primary disabled:opacity-50"
                        />
                      </div>
                    ) : (
                      <span className="font-medium text-white">
                        {formatCurrency(category.nightly_rate)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      disabled={!canEdit || savingId === category.id}
                      onClick={() => handleAvailabilityToggle(category)}
                      aria-pressed={!category.is_unavailable}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-300 ${
                        category.is_unavailable
                          ? "border-red-400/25 bg-red-400/10 text-red-300"
                          : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      } ${canEdit ? "cursor-pointer hover:opacity-80" : "cursor-default opacity-90"} disabled:cursor-not-allowed`}
                    >
                      {category.is_unavailable ? "Unavailable" : "Available"}
                    </button>
                  </td>
                </tr>
              ))}

            {!isLoading && !loadError && activeCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-sm text-white/40">
                  No room categories configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
