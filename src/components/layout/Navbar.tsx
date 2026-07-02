import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Rooms", href: "#rooms" },
  { label: "Gallery", href: "#gallery" },
  { label: "Reviews", href: "#reviews" },
  { label: "Availability", href: "#booking" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#home");

  useEffect(() => {
    const sections = NAV_LINKS.map((link) =>
      document.querySelector(link.href),
    ).filter((el): el is Element => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveHref(`#${visible[0].target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--header-height)]">
      <nav className="glass-panel mx-auto flex h-full max-w-7xl items-center justify-between rounded-none border-x-0 border-t-0 px-6">
        <a href="#home" className="font-display text-xl font-semibold text-primary">
          Kamala Inn Grand
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  activeHref === link.href
                    ? "text-primary"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <Link
          to="/admin"
          className="hidden rounded-full bg-primary px-5 py-2 text-sm font-semibold text-background-dark transition-transform hover:scale-105 md:inline-block"
        >
          Staff
        </Link>

        <button
          type="button"
          className="text-white md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="glass-panel mx-4 mt-2 flex flex-col gap-1 rounded-2xl p-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeHref === link.href
                  ? "bg-primary/15 text-primary"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/admin"
            onClick={() => setIsMenuOpen(false)}
            className="mt-1 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-background-dark"
          >
            Staff
          </Link>
        </div>
      )}
    </header>
  );
}
