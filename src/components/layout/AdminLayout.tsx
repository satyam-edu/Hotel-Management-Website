import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Grid3x3,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import logo from "../../assets/logo.png";

interface AdminNavLink {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

const ADMIN_NAV_LINKS: AdminNavLink[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Front Desk", to: "/admin/front-desk", icon: Inbox },
  { label: "Live Room Map", to: "/admin/room-map", icon: Grid3x3 },
  { label: "Master Ledger", to: "/admin/ledger", icon: BookOpen },
  { label: "Settings & Audit", to: "/admin/settings", icon: Settings },
];

const CURRENT_ADMIN_ROLE = "Front Desk Admin";

export function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    navigate("/admin");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-white/10 bg-background-dark">
        <div className="flex h-[var(--header-height)] items-center gap-2.5 border-b border-white/10 px-6">
          <img src={logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <span className="font-display text-lg font-semibold text-primary">
            Kamala Inn Grand
          </span>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {ADMIN_NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <link.icon size={18} className="shrink-0" strokeWidth={1.75} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col pl-64">
        <header className="flex h-[var(--header-height)] items-center justify-between border-b border-white/10 bg-background-dark px-8">
          <p className="text-sm text-white/50">
            Signed in as{" "}
            <span className="font-semibold text-white">
              {CURRENT_ADMIN_ROLE}
            </span>
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs uppercase tracking-widest text-white/60 transition-colors duration-300 hover:bg-white/5 hover:text-white/90"
          >
            <LogOut size={14} />
            Logout
          </button>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
