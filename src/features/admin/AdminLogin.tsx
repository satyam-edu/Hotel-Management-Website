import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import logo from "../../assets/logo.png";

const BOOTSTRAP_EMAIL = "admin@test.com";
const BOOTSTRAP_PASSWORD = "KamalaAdmin2026!";

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

const SUCCESS_REDIRECT_DELAY_MS = 700;

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/admin/dashboard";

  useEffect(() => {
    if (!justSignedIn) return;

    const timeout = setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, SUCCESS_REDIRECT_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [justSignedIn, navigate, redirectTo]);

  if (!isLoading && session && !justSignedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: loginError } = await login(email, password);

    setIsSubmitting(false);

    if (loginError) {
      setError(loginError);
      return;
    }

    setJustSignedIn(true);
  }

  async function handleBootstrapSignUp() {
    if (!supabase) {
      setBootstrapMessage("Authentication service is not configured.");
      return;
    }

    setIsBootstrapping(true);
    setBootstrapMessage(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: BOOTSTRAP_EMAIL,
      password: BOOTSTRAP_PASSWORD,
    });

    setIsBootstrapping(false);
    setBootstrapMessage(
      signUpError
        ? `Sign-up failed: ${signUpError.message}`
        : `Auth user created for ${BOOTSTRAP_EMAIL}. Now assign a role to this user in the Supabase SQL editor (staff_roles table).`,
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <img src={logo} alt="" className="h-16 w-16 object-contain" />
          <h1 className="font-display mt-4 text-2xl font-semibold text-white">
            Staff Portal
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Sign in to manage Kamala Inn Grand
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-panel mt-8 rounded-xl p-6 sm:p-8"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@kamalainngrand.com"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClasses}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClasses} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-white/40 transition-colors duration-300 hover:text-white/80"
                >
                  {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          {justSignedIn && (
            <p className="mt-4 text-sm text-emerald-400" role="status">
              Signed in — redirecting…
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || justSignedIn}
            className="mt-7 w-full rounded-sm bg-primary py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {justSignedIn
              ? "Redirecting…"
              : isSubmitting
                ? "Authenticating…"
                : "Authenticate"}
          </button>
        </form>

        <a
          href="/"
          className="mt-6 block text-center text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
        >
          Back to Homepage
        </a>

        {import.meta.env.DEV && (
          <div className="mt-10 rounded-sm border border-dashed border-white/15 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40">
              Dev Only — Bootstrap
            </p>
            <p className="mt-1.5 text-xs text-white/50">
              Creates the auth user {BOOTSTRAP_EMAIL}. Role must still be
              assigned manually in the Supabase SQL editor.
            </p>
            <button
              type="button"
              onClick={handleBootstrapSignUp}
              disabled={isBootstrapping}
              className="mt-3 w-full rounded-sm border border-white/15 py-2 text-xs uppercase tracking-widest text-white/70 transition-colors duration-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBootstrapping ? "Creating…" : "Create Bootstrap Admin User"}
            </button>
            {bootstrapMessage && (
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                {bootstrapMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
