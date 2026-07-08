import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Grid3x3,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { logAction } from "../../../lib/audit";
import {
  createPhysicalRoom,
  deletePhysicalRoom,
  hasActiveReservation,
  loadPhysicalRooms,
  loadRoomCategories,
  reassignPhysicalRoomCategory,
  type PhysicalRoomWithCategory,
} from "../../../lib/rooms";
import { supabase } from "../../../lib/supabase";
import type { RoomCategory } from "../../../types/database";

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary disabled:opacity-50";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

interface NewRoomForm {
  roomNumber: string;
  floor: string;
  categoryId: string;
}

export function PhysicalRoomMapper() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<PhysicalRoomWithCategory[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set());

  function toggleFloor(floor: number) {
    setExpandedFloors((prev) => {
      const next = new Set(prev);
      if (next.has(floor)) {
        next.delete(floor);
      } else {
        next.add(floor);
      }
      return next;
    });
  }

  const activeCategories = categories.filter((c) => !c.is_archived);

  const [newRoom, setNewRoom] = useState<NewRoomForm>({
    roomNumber: "",
    floor: "1",
    categoryId: "",
  });

  async function loadAll() {
    setIsLoading(true);
    const [roomsResult, categoriesResult] = await Promise.all([
      loadPhysicalRooms(),
      loadRoomCategories(),
    ]);
    setRooms(roomsResult.data);
    setCategories(categoriesResult.data);
    setLoadError(roomsResult.error ?? categoriesResult.error);
    setIsLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("physical_rooms_manager")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "physical_rooms" },
        () => loadAll(),
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!newRoom.categoryId && activeCategories.length > 0) {
      setNewRoom((prev) => ({ ...prev, categoryId: activeCategories[0].id }));
    }
  }, [activeCategories, newRoom.categoryId]);

  function flashSuccess(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  const roomsByFloor = useMemo(() => {
    const groups = new Map<number, PhysicalRoomWithCategory[]>();
    for (const room of rooms) {
      const list = groups.get(room.floor) ?? [];
      list.push(room);
      groups.set(room.floor, list);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([floor, floorRooms]) => ({
        floor,
        rooms: floorRooms.sort((a, b) => a.room_number.localeCompare(b.room_number)),
      }));
  }, [rooms]);

  async function handleAddRoom(event: FormEvent) {
    event.preventDefault();

    if (!newRoom.roomNumber.trim() || !newRoom.categoryId) {
      setActionError("Room number and category are required.");
      return;
    }

    const floor = Number(newRoom.floor);
    if (Number.isNaN(floor) || floor <= 0) {
      setActionError("Please enter a valid floor number.");
      return;
    }

    setIsSubmittingNew(true);
    setActionError(null);

    const result = await createPhysicalRoom({
      room_number: newRoom.roomNumber.trim(),
      floor,
      category_id: newRoom.categoryId,
    });

    setIsSubmittingNew(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    if (user) {
      await logAction(
        user.id,
        "create_room",
        `Added Room ${newRoom.roomNumber.trim()} on floor ${floor}.`,
      );
    }

    flashSuccess(`Room ${newRoom.roomNumber.trim()} added.`);
    setNewRoom({ roomNumber: "", floor: String(floor), categoryId: newRoom.categoryId });
    setIsAddingRoom(false);
    await loadAll();
  }

  async function handleReassign(
    room: PhysicalRoomWithCategory,
    categoryId: string,
  ): Promise<boolean> {
    setActionError(null);

    const result = await reassignPhysicalRoomCategory(room.id, categoryId);

    if (result.error) {
      setActionError(result.error);
      return false;
    }

    const newCategoryName =
      categories.find((c) => c.id === categoryId)?.name ?? "a different category";

    if (user) {
      await logAction(
        user.id,
        "reassign_room_category",
        `Changed Room ${room.room_number} category from ${room.category_name} to ${newCategoryName}.`,
      );
    }

    flashSuccess(`Room ${room.room_number} moved to ${newCategoryName}.`);
    await loadAll();
    return true;
  }

  async function handleDelete(room: PhysicalRoomWithCategory): Promise<boolean> {
    setActionError(null);

    const activeCheck = await hasActiveReservation(room.room_number);
    if (activeCheck.error) {
      setActionError(activeCheck.error);
      return false;
    }
    if (activeCheck.hasActive) {
      setActionError(
        `Room ${room.room_number} has an active reservation and cannot be removed.`,
      );
      return false;
    }

    const result = await deletePhysicalRoom(room.id);

    if (result.error) {
      setActionError(result.error);
      return false;
    }

    if (user) {
      await logAction(user.id, "delete_room", `Removed Room ${room.room_number}.`);
    }

    flashSuccess(`Room ${room.room_number} removed.`);
    await loadAll();
    return true;
  }

  return (
    <div className="glass-panel rounded-xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Grid3x3 size={20} className="text-primary" />
          <h2 className="font-display text-xl font-semibold text-white">
            Physical Room Mapping
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingRoom(true)}
          disabled={activeCategories.length === 0}
          className="flex items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} />
          Add Room
        </button>
      </div>
      <p className="mt-2 text-sm text-white/60">
        Every numbered room in the property, mapped to a category. This is
        what the Room Map and Front Desk assign guests into directly.
      </p>

      {actionError && !isAddingRoom && (
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

      {activeCategories.length === 0 && !isLoading && (
        <p className="mt-3 text-xs text-amber-300">
          Create a room category first before mapping physical rooms.
        </p>
      )}

      {isAddingRoom &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex h-screen w-screen min-h-screen items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-background-dark p-8 shadow-2xl sm:p-10">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-semibold text-white">
                  Add Physical Room
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  aria-label="Close"
                  className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/80"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddRoom} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="newRoomNumber" className={labelClasses}>
                    Room Number
                  </label>
                  <input
                    id="newRoomNumber"
                    type="text"
                    required
                    disabled={isSubmittingNew}
                    value={newRoom.roomNumber}
                    onChange={(e) =>
                      setNewRoom((prev) => ({ ...prev, roomNumber: e.target.value }))
                    }
                    placeholder="e.g. 204"
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="newRoomFloor" className={labelClasses}>
                    Floor
                  </label>
                  <input
                    id="newRoomFloor"
                    type="number"
                    min={1}
                    required
                    disabled={isSubmittingNew}
                    value={newRoom.floor}
                    onChange={(e) =>
                      setNewRoom((prev) => ({ ...prev, floor: e.target.value }))
                    }
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label htmlFor="newRoomCategory" className={labelClasses}>
                    Category
                  </label>
                  <select
                    id="newRoomCategory"
                    required
                    disabled={isSubmittingNew || activeCategories.length === 0}
                    value={newRoom.categoryId}
                    onChange={(e) =>
                      setNewRoom((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                    className={inputClasses}
                  >
                    {activeCategories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                        className="bg-background-dark"
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {actionError && (
                  <p className="text-sm text-red-400" role="alert">
                    {actionError}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingNew || activeCategories.length === 0}
                    className="flex items-center justify-center gap-1.5 rounded-sm bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={14} />
                    {isSubmittingNew ? "Adding…" : "Add Room"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingRoom(false)}
                    disabled={isSubmittingNew}
                    className="rounded-sm border border-white/15 px-4 py-2.5 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {isLoading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-sm border border-white/10 p-8 text-sm text-white/40">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
          Loading rooms…
        </div>
      )}

      {!isLoading && loadError && (
        <p className="mt-6 text-sm text-red-400" role="alert">
          {loadError}
        </p>
      )}

      {!isLoading && !loadError && (
        <div className="mt-6 space-y-3">
          {roomsByFloor.map(({ floor, rooms: floorRooms }) => {
            const isExpanded = expandedFloors.has(floor);

            return (
              <div
                key={floor}
                className="overflow-hidden rounded-sm border border-white/10 bg-white/[0.02]"
              >
                <button
                  type="button"
                  onClick={() => toggleFloor(floor)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-300 hover:bg-white/[0.03]"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Floor {floor}
                    <span className="ml-2 text-white/30">
                      ({floorRooms.length} room{floorRooms.length === 1 ? "" : "s"})
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-white/40 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-2 gap-5 border-t border-white/10 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {floorRooms.map((room) => (
                      <RoomMappingCard
                        key={room.id}
                        room={room}
                        categories={activeCategories}
                        onReassign={handleReassign}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {roomsByFloor.length === 0 && (
            <p className="rounded-sm border border-white/10 p-6 text-center text-sm text-white/40">
              No physical rooms mapped yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface RoomMappingCardProps {
  room: PhysicalRoomWithCategory;
  categories: RoomCategory[];
  onReassign: (room: PhysicalRoomWithCategory, categoryId: string) => Promise<boolean>;
  onDelete: (room: PhysicalRoomWithCategory) => Promise<boolean>;
}

function RoomMappingCard({ room, categories, onReassign, onDelete }: RoomMappingCardProps) {
  const [draftCategoryId, setDraftCategoryId] = useState(room.category_id);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDirty = draftCategoryId !== room.category_id;

  async function handleSave() {
    setIsSaving(true);
    const succeeded = await onReassign(room, draftCategoryId);
    setIsSaving(false);
    // On failure, keep the draft as-is so the admin doesn't lose their pick
    // and can retry — the card stays dirty/amber until it either saves or
    // they manually revert the dropdown.
    if (!succeeded) return;
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    const succeeded = await onDelete(room);
    setIsDeleting(false);
    if (!succeeded) {
      setPendingDelete(false);
    }
  }

  return (
    <div
      className={`glass-panel relative flex min-h-[130px] flex-col rounded-xl border p-5 transition-colors duration-300 ${
        isDirty
          ? "border-primary/50 bg-primary/[0.06]"
          : "border-white/10"
      }`}
    >
      {pendingDelete ? (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-sm bg-background-dark/95 p-1">
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirmDelete}
            className="rounded-sm bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400 transition-colors duration-300 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "…" : "Confirm?"}
          </button>
          <button
            type="button"
            onClick={() => setPendingDelete(false)}
            className="rounded-sm px-2 py-1 text-[11px] text-white/50 transition-colors duration-300 hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Delete Room ${room.room_number}`}
          onClick={() => setPendingDelete(true)}
          className="absolute right-3 top-3 rounded-sm p-1.5 text-white/30 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-400"
        >
          <Trash2 size={15} />
        </button>
      )}

      <p className="font-display pr-8 text-2xl font-semibold text-white">
        {room.room_number}
      </p>

      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              aria-label={`Category for Room ${room.room_number}`}
              disabled={isSaving}
              value={draftCategoryId}
              onChange={(e) => setDraftCategoryId(e.target.value)}
              className={`${inputClasses} appearance-none pr-9`}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="bg-background-dark">
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
            />
          </div>

          {isDirty && (
            <button
              type="button"
              aria-label={`Save category for Room ${room.room_number}`}
              disabled={isSaving}
              onClick={handleSave}
              className="flex shrink-0 items-center justify-center rounded-sm bg-primary p-2 text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
