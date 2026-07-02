import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 block text-xs tracking-wide text-white/50";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/admin/dashboard");
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
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClasses}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-7 w-full rounded-sm bg-primary py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90"
          >
            Authenticate
          </button>
        </form>

        <a
          href="/"
          className="mt-6 block text-center text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
        >
          Back to Homepage
        </a>
      </div>
    </div>
  );
}
