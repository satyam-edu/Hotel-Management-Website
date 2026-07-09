import { useState, type FormEvent } from "react";
import { KeyRound, Mail, User } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { updateStaff } from "../../../lib/staffAdmin";

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 flex items-center gap-1.5 text-xs tracking-wide text-white/50";

// Every staff member's identity is read live from their own authenticated
// session (useAuth's user/staffUsername), never a hardcoded literal — this
// panel is what replaces the old dev-only bootstrap credentials as the real,
// ongoing way a Master Admin (or any staff member) manages their own
// username/email/password. It routes through the staff-admin edge function's
// self-edit path rather than calling supabase.auth.updateUser() directly,
// since username lives in staff_roles, which has no client-writable UPDATE
// policy (see 0001_init_schema.sql) — the service-role bypass is required
// even for editing yourself.
export function MyProfileTab() {
  const { user, staffUsername, refreshProfile } = useAuth();

  const [username, setUsername] = useState(staffUsername ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldError, setFieldError] = useState<{
    field: "username" | "email" | "password" | null;
    message: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError(null);
    setSuccessMessage(null);

    if (password && password.length < 6) {
      setFieldError({ field: "password", message: "Password must be at least 6 characters." });
      return;
    }

    setIsSaving(true);

    const result = await updateStaff({
      id: user!.id,
      username: username !== staffUsername ? username : undefined,
      email: email !== user!.email ? email : undefined,
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

    setPassword("");
    setSuccessMessage("Your profile was updated.");
    await refreshProfile();
  }

  return (
    <div className="glass-panel max-w-lg rounded-xl p-6 sm:p-8">
      <h2 className="font-display text-xl font-semibold text-white">My Profile</h2>
      <p className="mt-1 text-sm text-white/60">
        Update your own sign-in username, email, or password.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="profileUsername" className={labelClasses}>
            <User size={14} />
            Username
          </label>
          <input
            id="profileUsername"
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
          <label htmlFor="profileEmail" className={labelClasses}>
            <Mail size={14} />
            Email
          </label>
          <input
            id="profileEmail"
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
          <label htmlFor="profilePassword" className={labelClasses}>
            <KeyRound size={14} />
            New Password
          </label>
          <input
            id="profilePassword"
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
        {successMessage && (
          <p className="text-xs text-emerald-400" role="status">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-sm bg-primary py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
