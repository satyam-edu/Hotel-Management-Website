import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Rooms", href: "#rooms" },
  { label: "Gallery", href: "#gallery" },
  { label: "Reviews", href: "#reviews" },
  { label: "Availability", href: "#booking" },
  { label: "Contact", href: "#contact" },
];

export function Navbar({ onAdminClick }: { onAdminClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = navLinks.map((l) => l.href.slice(1));
      const headerH = 72;
      let current = "home";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top - headerH - 40;
          if (top <= 0) current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b"
      style={{
        background: scrolled ? "rgba(9, 22, 40, 0.85)" : "rgba(9, 22, 40, 0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: scrolled ? "rgba(201,168,76,0.15)" : "transparent",
        paddingTop: scrolled ? "0.5rem" : "1.2rem",
        paddingBottom: scrolled ? "0.5rem" : "1.2rem",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <button
            onClick={() => scrollTo("#home")}
            className="flex flex-col leading-none text-left group"
          >
            <span
              className="text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 group-hover:text-white"
              style={{ color: "#C9A84C", fontFamily: "'Inter', sans-serif" }}
            >
              Hotel
            </span>
            <span
              className="text-[20px] tracking-wide mt-1 transition-transform duration-300"
              style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}
            >
              Kamla Inn Grand
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.slice(1);
              return (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-sm tracking-widest uppercase transition-all duration-300 relative py-2"
                  style={{
                    color: isActive ? "#C9A84C" : "rgba(255,255,255,0.6)",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "12px",
                  }}
                >
                  <span className="hover:text-white transition-colors">{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px]"
                      style={{ background: "#C9A84C" }}
                    />
                  )}
                </button>
              );
            })}
            <div className="w-px h-4 bg-white/10 mx-2" />
            <button
              onClick={onAdminClick}
              className="text-[10px] tracking-[0.2em] uppercase px-4 py-2 rounded-sm border transition-all duration-300 hover:bg-white/5"
              style={{
                color: "rgba(255,255,255,0.5)",
                borderColor: "rgba(255,255,255,0.15)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Staff
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded text-white hover:text-[#C9A84C] transition-colors"
          >
            {menuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-white/5"
            style={{
              background: "rgba(9, 22, 40, 0.98)",
              backdropFilter: "blur(24px)",
              marginTop: scrolled ? "0.5rem" : "1.2rem",
            }}
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.slice(1);
                return (
                  <button
                    key={link.href}
                    onClick={() => scrollTo(link.href)}
                    className="text-left py-2 text-sm uppercase tracking-widest transition-colors"
                    style={{
                      color: isActive ? "#C9A84C" : "rgba(255,255,255,0.7)",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {link.label}
                  </button>
                );
              })}
              <div className="h-px bg-white/5 my-2" />
              <button
                onClick={() => { onAdminClick(); setMenuOpen(false); }}
                className="text-left py-2 text-xs uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif" }}
              >
                Staff Portal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
