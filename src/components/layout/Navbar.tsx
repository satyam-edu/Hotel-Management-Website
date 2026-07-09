import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../assets/logo.png";

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const linkRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          const href = `#${visible[0].target.id}`;
          setActiveHref(href);
          // Keep the URL in sync so a reload lands back on the same
          // section — replaceState avoids stacking a history entry per
          // scroll tick, unlike setting location.hash directly.
          if (window.location.hash !== href) {
            window.history.replaceState(null, "", href);
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Cold-load restoration: if the guest reloads on a deep link (e.g.
  // #contact), scroll there once the page has actually finished growing to
  // its final height. RoomsSection and GallerySection both fetch their data
  // independently after mount and insert real content once it arrives —
  // scrolling immediately on mount would land on the right element before
  // those later sections push #contact further down the page, causing the
  // exact "scrolled to Reviews instead of Contact" drift this guards
  // against. A ResizeObserver on <body> re-scrolls on every height change
  // and only stops once the height has been quiet for one debounce window,
  // which naturally waits out however long those fetches take instead of
  // guessing a fixed delay. scroll-padding-top (src/index.css) already
  // accounts for the fixed header's height, and the global
  // scroll-behavior: smooth makes each correction a gentle transition
  // rather than a jarring re-jump.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    let settleTimeout: ReturnType<typeof setTimeout> | null = null;
    let hasSettled = false;

    function scrollToHash() {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveHref(hash);
      }
    }

    const observer = new ResizeObserver(() => {
      if (hasSettled) return;

      scrollToHash();

      if (settleTimeout) clearTimeout(settleTimeout);
      settleTimeout = setTimeout(() => {
        hasSettled = true;
        observer.disconnect();
      }, 400);
    });

    observer.observe(document.body);

    return () => {
      if (settleTimeout) clearTimeout(settleTimeout);
      observer.disconnect();
    };
  }, []);

  // Fallback for production viewports where the footer (#contact) is too
  // short to ever cross the IntersectionObserver's narrow rootMargin band —
  // once the guest has scrolled to the literal bottom of the page, force the
  // highlight to Contact regardless of what the observer reported, since
  // there's nothing further below it to be "more visible" than.
  useEffect(() => {
    function handleScroll() {
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
      if (isAtBottom) {
        setActiveHref("#contact");
        if (window.location.hash !== "#contact") {
          window.history.replaceState(null, "", "#contact");
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Measures the active link's own box so the indicator can glide to it
  // rather than snapping instantly — re-measured on resize too, since a
  // link's offsetLeft/offsetWidth shift whenever the row reflows.
  useEffect(() => {
    function measure() {
      const activeEl = linkRefs.current[activeHref];
      if (activeEl) {
        setIndicatorStyle({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
      }
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeHref]);

  return (
    <header
      className={`glass-header fixed left-0 top-0 z-50 w-full transition-shadow duration-300 ${
        isScrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.18)]" : ""
      }`}
    >
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 md:px-8">
        <a href="#home" className="flex items-center gap-2.5">
          <img
            src={logo}
            alt=""
            className="h-11 w-11 shrink-0 object-contain"
          />
          <span className="font-display text-xl font-semibold text-primary">
            Kamala Inn Grand
          </span>
        </a>

        <ul className="relative hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                ref={(el) => {
                  linkRefs.current[link.href] = el;
                }}
                href={link.href}
                className={`pb-1 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                  activeHref === link.href
                    ? "text-primary"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}

          <div
            className="pointer-events-none absolute bottom-0 h-[2px] translate-y-[4px] bg-primary transition-all duration-300 ease-in-out"
            style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px` }}
          />
        </ul>

        <Link
          to="/admin"
          className="hidden rounded-sm border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/50 transition-colors duration-300 hover:bg-white/5 hover:text-white/80 md:inline-block"
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
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
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
            className="mt-1 rounded-sm border border-white/10 px-3 py-2.5 text-center text-xs uppercase tracking-[0.2em] text-white/40"
          >
            Staff
          </Link>
        </div>
      )}
    </header>
  );
}
