import { useState, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Rooms } from "./components/Rooms";
import { Amenities } from "./components/Amenities";
import { Gallery } from "./components/Gallery";
import { Reviews } from "./components/Reviews";
import { Booking } from "./components/Booking";
import { Footer } from "./components/Footer";
import { WhatsApp } from "./components/WhatsApp";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./components/AdminDashboard";

type View = "guest" | "admin-login" | "admin-dashboard";

export default function App() {
  const [view, setView] = useState<View>("guest");
  const [preselectedRoom, setPreselectedRoom] = useState<string | undefined>();

  const handleBookRoom = (roomId: string) => {
    setPreselectedRoom(roomId);
    const el = document.getElementById("booking");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleBookNow = () => {
    const el = document.getElementById("booking");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  if (view === "admin-login") {
    return (
      <AdminLogin
        onLogin={() => setView("admin-dashboard")}
        onBack={() => setView("guest")}
      />
    );
  }

  if (view === "admin-dashboard") {
    return (
      <AdminDashboard
        onLogout={() => setView("admin-login")}
        onGuestPortal={() => setView("guest")}
      />
    );
  }

  return (
    <div style={{ background: "#0F1E3C" }}>
      <Navbar onAdminClick={() => setView("admin-login")} />

      <main>
        <Hero onBookNow={handleBookNow} />
        <About />
        <Rooms onBookRoom={handleBookRoom} />
        <Amenities />
        <Gallery />
        <Reviews />
        <Booking preselectedRoom={preselectedRoom} />
      </main>

      <Footer />
      <WhatsApp />
    </div>
  );
}
