import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppWidget } from "../ui/WhatsAppWidget";
import { useSystemContext } from "../../context/SystemContext";

function MaintenanceNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-primary">
        Kamala Inn Grand
      </p>
      <h1 className="font-display mt-4 text-3xl font-semibold text-white sm:text-4xl">
        Temporarily Closed for Maintenance
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
        We're making a few updates behind the scenes. Please check back
        shortly, or reach out directly if you need immediate assistance.
      </p>
    </div>
  );
}

export function Layout() {
  const { config } = useSystemContext();

  if (config.maintenance_mode) {
    return <MaintenanceNotice />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  );
}
