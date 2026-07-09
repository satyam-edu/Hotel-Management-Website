import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { updateStaff } from "../../../lib/staffAdmin";
import type { StaffAccountWithEmail } from "../../../lib/staffAdmin";

interface EditStaffModalProps {
  account: StaffAccountWithEmail;
  onClose: () => void;
  onSaved: () => void;
}

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

// Editing another account's credentials always goes through the staff-admin
// edge function's service-role bypass (Section 2.9-style pattern) — never
// direct client writes to auth.users or staff_roles, since only the
// service role can update someone else's email/password. Fields are
// optional: an empty password means "leave unchanged", not "clear it".
export function EditStaffModal({ account, onClose, onSaved }: EditStaffModalProps) {
  const [username, setUsername] = useState(account.username);
  const [email, setEmail] = useState(account.email);
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldError, setFieldError] = useState<{
    field: "username" | "email" | "password" | null;
    message: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);

    if (password && password.length < 6) {
      setFieldError({ field: "password", message: "Password must be at least 6 characters." });
      return;
    }

    setIsSaving(true);

    const result = await updateStaff({
      id: account.id,
      username: username !== account.username ? username : undefined,
      email: email !== account.email ? email : undefined,
      password: password || undefined,
    });

    setIsSaving(false);

    if (result.errorCode === "duplicate_username") {
      setFieldError({ field: "username", message: result.errorMessage ?? "That username is already in use." });
      return;
    }
    if (result.errorCode) {
      setFieldError({ field: null, message: result.errorMessage ?? "Could not save changes." });
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-panel max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold text-white">
            Edit Staff Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/80"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="editUsername" className={labelClasses}>
              Username
            </label>
            <input
              id="editUsername"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClasses}
            />
            {fieldError?.field === "username" && (
              <p className="mt-1.5 text-xs text-red-400">{fieldError.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="editEmail" className={labelClasses}>
              Email
            </label>
            <input
              id="editEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
            {fieldError?.field === "email" && (
              <p className="mt-1.5 text-xs text-red-400">{fieldError.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="editPassword" className={labelClasses}>
              New Password
            </label>
            <input
              id="editPassword"
              type="password"
              minLength={6}
              placeholder="Leave blank to keep current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
            {fieldError?.field === "password" && (
              <p className="mt-1.5 text-xs text-red-400">{fieldError.message}</p>
            )}
          </div>

          {fieldError && fieldError.field === null && (
            <p className="text-xs text-red-400" role="alert">
              {fieldError.message}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-sm bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
