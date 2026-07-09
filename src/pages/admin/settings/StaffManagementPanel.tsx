import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown, Mail, Pencil, ShieldAlert, Trash2, User } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import {
  createStaff,
  deleteStaff,
  listStaff,
  revokeStaff,
  type StaffAccountWithEmail,
} from "../../../lib/staffAdmin";
import { EditStaffModal } from "./EditStaffModal";
import type { StaffRoleType } from "../../../types/database";

const ROLE_BADGE_STYLES: Record<StaffRoleType, string> = {
  master_admin: "bg-primary/10 text-primary border-primary/25",
  head_admin: "bg-blue-400/10 text-blue-300 border-blue-400/25",
  sub_admin: "bg-white/10 text-white/60 border-white/15",
};

const ROLE_LABELS: Record<StaffRoleType, string> = {
  master_admin: "Master Admin",
  head_admin: "Head Admin",
  sub_admin: "Staff (Sub Admin)",
};

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 flex items-center gap-1.5 text-xs tracking-wide text-white/50";

function canActOn(callerRole: StaffRoleType, targetRole: StaffRoleType): boolean {
  if (targetRole === "master_admin") return false;
  if (callerRole === "master_admin") return true;
  if (callerRole === "head_admin") return targetRole === "sub_admin";
  return false;
}

function creatableRoles(callerRole: StaffRoleType): StaffRoleType[] {
  if (callerRole === "master_admin") return ["head_admin", "sub_admin"];
  if (callerRole === "head_admin") return ["sub_admin"];
  return [];
}

interface FormState {
  username: string;
  email: string;
  password: string;
  role: StaffRoleType;
}

export function StaffManagementPanel() {
  const { role } = useAuth();
  const canView = role === "master_admin" || role === "head_admin";

  const [staff, setStaff] = useState<StaffAccountWithEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const allowedRoles = role ? creatableRoles(role) : [];
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    role: allowedRoles[allowedRoles.length - 1] ?? "sub_admin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: "username" | "email" | null; message: string } | null>(
    null,
  );

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<StaffAccountWithEmail | null>(
    null,
  );
  const isMasterAdmin = role === "master_admin";

  async function reload() {
    setIsLoading(true);
    const result = await listStaff();
    setStaff(result.data);
    setLoadError(result.error);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!canView) return;
    reload();
  }, [canView]);

  if (!canView) {
    return (
      <div className="glass-panel flex items-center gap-3 rounded-xl p-6 text-sm text-white/60">
        <ShieldAlert size={18} className="shrink-0 text-amber-400" />
        You do not have permission to manage staff accounts.
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setIsSubmitting(true);

    const result = await createStaff(form);

    if (result.errorCode === "duplicate_username") {
      setFieldError({ field: "username", message: result.errorMessage ?? "That username is already in use." });
    } else if (result.errorCode === "duplicate_email") {
      setFieldError({ field: "email", message: result.errorMessage ?? "That email is already registered." });
    } else if (result.errorCode) {
      setFieldError({ field: null, message: result.errorMessage ?? "Could not create the account." });
    } else {
      setForm({
        username: "",
        email: "",
        password: "",
        role: allowedRoles[allowedRoles.length - 1] ?? "sub_admin",
      });
      await reload();
    }

    setIsSubmitting(false);
  }

  async function handleRevoke(target: StaffAccountWithEmail) {
    if (!window.confirm(`Revoke access for "${target.username}"? They will be signed out immediately.`)) {
      return;
    }

    setRevokingId(target.id);
    const result = await revokeStaff(target.id);
    if (!result.success) {
      window.alert(result.errorMessage ?? "Could not revoke this account.");
    } else {
      await reload();
    }
    setRevokingId(null);
  }

  async function handleDelete(target: StaffAccountWithEmail) {
    if (
      !window.confirm(
        `Permanently delete "${target.username}"? This removes their account entirely and cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(target.id);
    const result = await deleteStaff(target.id);
    if (!result.success) {
      window.alert(result.errorMessage ?? "Could not delete this account.");
    } else {
      await reload();
    }
    setDeletingId(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <form onSubmit={handleSubmit} className="glass-panel h-fit rounded-xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-white">
          Register New Staff
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="username" className={labelClasses}>
              <User size={14} />
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className={inputClasses}
            />
            {fieldError?.field === "username" && (
              <p className="mt-1.5 text-xs text-red-400">{fieldError.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="staffEmail" className={labelClasses}>
              <Mail size={14} />
              Email
            </label>
            <input
              id="staffEmail"
              type="email"
              required
              placeholder="staff@kamalainngrand.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClasses}
            />
            {fieldError?.field === "email" && (
              <p className="mt-1.5 text-xs text-red-400">{fieldError.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="tempPassword" className={labelClasses}>
              Temporary Password
            </label>
            <input
              id="tempPassword"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="staffRole" className={labelClasses}>
              Role
            </label>
            <div className="relative">
              <select
                id="staffRole"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRoleType }))}
                className={`${inputClasses} appearance-none pr-9`}
              >
                {allowedRoles.map((r) => (
                  <option key={r} value={r} className="bg-background-dark">
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
              />
            </div>
          </div>

          {fieldError && fieldError.field === null && (
            <p className="text-xs text-red-400" role="alert">
              {fieldError.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 w-full rounded-sm bg-primary py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create Account"}
        </button>
      </form>

      <div className="glass-panel rounded-xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-white">
          Active Staff
        </h2>

        {isLoading && (
          <div className="mt-6 flex items-center justify-center gap-3 py-8 text-sm text-white/40">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-primary" />
            Loading staff accounts…
          </div>
        )}

        {!isLoading && loadError && (
          <div className="mt-6 rounded-sm border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-400" role="alert">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && (
          <ul className="mt-6 space-y-3">
            {staff.map((account) => {
              const isDeactivated = Boolean(account.deactivated_at);
              const canRevokeThis = role ? canActOn(role, account.role) : false;
              // Edit/Delete are strictly master_admin-only per Section 2.4,
              // and even the Master Administrator can never target another
              // master_admin account this way (there is only ever one).
              const canHardModifyThis = isMasterAdmin && account.role !== "master_admin";

              return (
                <li
                  key={account.id}
                  className={`flex items-center justify-between rounded-sm border border-white/10 bg-white/[0.03] px-5 py-4 ${
                    isDeactivated ? "opacity-50" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {account.username}
                      {isDeactivated && (
                        <span className="ml-2 text-xs font-normal uppercase tracking-wider text-white/40">
                          Deactivated
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">{account.email}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${ROLE_BADGE_STYLES[account.role]}`}
                    >
                      {ROLE_LABELS[account.role]}
                    </span>

                    {canHardModifyThis && (
                      <button
                        type="button"
                        aria-label={`Edit profile for ${account.username}`}
                        onClick={() => setEditingAccount(account)}
                        className="rounded-sm p-2 text-white/40 transition-colors duration-300 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil size={16} />
                      </button>
                    )}

                    {!isDeactivated && canRevokeThis && (
                      <button
                        type="button"
                        aria-label={`Revoke access for ${account.username}`}
                        disabled={revokingId === account.id}
                        onClick={() => handleRevoke(account)}
                        className="rounded-sm p-2 text-white/40 transition-colors duration-300 hover:bg-amber-400/10 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Revoke access (soft, sign out immediately)"
                      >
                        <ShieldAlert size={16} />
                      </button>
                    )}

                    {canHardModifyThis && (
                      <button
                        type="button"
                        aria-label={`Permanently delete account for ${account.username}`}
                        disabled={deletingId === account.id}
                        onClick={() => handleDelete(account)}
                        className="rounded-sm p-2 text-white/40 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Permanently delete account"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}

            {staff.length === 0 && (
              <li className="py-8 text-center text-sm text-white/40">
                No staff accounts yet.
              </li>
            )}
          </ul>
        )}
      </div>

      {editingAccount && (
        <EditStaffModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSaved={() => {
            setEditingAccount(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
