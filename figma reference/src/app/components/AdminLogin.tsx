import { useState } from "react";
import { Eye, EyeOff, Lock, User, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export function AdminLogin({ onLogin, onBack }: { onLogin: () => void; onBack?: () => void }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (form.username === "admin" && form.password === "kamla2025") {
        onLogin();
      } else {
        setError("Invalid credentials. Use admin / kamla2025 to demo.");
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#060F20" }}
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
        />
        <div className="absolute inset-0 bg-[#060F20]/60 backdrop-blur-[60px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Back Link */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onBack}
            className="flex items-center gap-2 mb-10 text-xs tracking-widest uppercase transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}
          >
            <ArrowLeft size={14} />
            Return to Homepage
          </motion.button>
        )}

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <span
            className="text-xs tracking-[0.4em] uppercase block mb-3"
            style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
          >
            Hotel
          </span>
          <h1
            style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", letterSpacing: "-0.02em" }}
          >
            Kamla Inn Grand
          </h1>
          <p
            className="text-[11px] mt-4 tracking-[0.2em] uppercase"
            style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif" }}
          >
            Staff Portal
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          }}
        >
          {/* Glass glare effect */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <h2
            className="mb-2 text-center text-xl"
            style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}
          >
            Sign In
          </h2>
          <p
            className="text-xs text-center mb-8"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}
          >
            Authorized personnel only
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="block text-[11px] mb-2 tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}
              >
                Username
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#C9A84C] opacity-0 group-focus-within:opacity-20 transition duration-300 blur" />
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="Enter username"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-lg outline-none text-sm transition-all"
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#fff",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                className="block text-[11px] mb-2 tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#C9A84C] opacity-0 group-focus-within:opacity-20 transition duration-300 blur" />
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Enter password"
                    required
                    className="w-full pl-11 pr-12 py-3.5 rounded-lg outline-none text-sm transition-all"
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#fff",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-4 hover:text-white transition-colors"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs py-3 px-4 rounded-lg flex items-center gap-2"
                style={{
                  color: "#fca5a5",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full py-4 rounded-lg overflow-hidden transition-all duration-300 disabled:opacity-60"
              style={{
                background: "transparent",
                border: "1px solid rgba(201,168,76,0.3)",
              }}
            >
              <div className="absolute inset-0 bg-[#C9A84C] transition-transform duration-300 group-hover:scale-105" />
              {loading && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              <span
                className="relative z-10 block"
                style={{
                  color: "#0F1E3C",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase"
                }}
              >
                {loading ? "Authenticating..." : "Secure Login"}
              </span>
            </button>
          </form>

          <p
            className="text-[10px] text-center mt-8 tracking-wide"
            style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Inter', sans-serif" }}
          >
            Demo credentials: <span className="text-white/40">admin</span> / <span className="text-white/40">kamla2025</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
