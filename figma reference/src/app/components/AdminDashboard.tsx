import { useState } from "react";
import {
  BedDouble, Users, TrendingUp, Calendar, LogOut, Home,
  FileText, Settings, Menu, X, CheckCircle, Clock, XCircle,
  Download, Plus, Eye, Edit3, Activity, CalendarDays, Printer, Archive, RefreshCw, Undo, Search
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 142000, bookings: 58 },
  { month: "Feb", revenue: 168000, bookings: 67 },
  { month: "Mar", revenue: 195000, bookings: 78 },
  { month: "Apr", revenue: 220000, bookings: 88 },
  { month: "May", revenue: 248000, bookings: 99 },
  { month: "Jun", revenue: 276000, bookings: 110 },
];

const rooms = [
  { id: 101, type: "Deluxe", status: "occupied", guest: "Rajesh K.", checkout: "Jul 3" },
  { id: 102, type: "Standard", status: "vacant", guest: null, checkout: null },
  { id: 103, type: "Suite", status: "occupied", guest: "Priya S.", checkout: "Jul 5" },
  { id: 104, type: "Deluxe", status: "occupied", guest: "Vikram S.", checkout: "Jul 2" },
  { id: 105, type: "Family", status: "maintenance", guest: null, checkout: null },
  { id: 106, type: "Standard", status: "vacant", guest: null, checkout: null },
  { id: 107, type: "Super Deluxe", status: "occupied", guest: "Ananya P.", checkout: "Jul 7" },
  { id: 108, type: "Standard", status: "vacant", guest: null, checkout: null },
  { id: 109, type: "Deluxe", status: "occupied", guest: "Suresh M.", checkout: "Jul 4" },
  { id: 110, type: "Suite", status: "vacant", guest: null, checkout: null },
  { id: 201, type: "Deluxe", status: "occupied", guest: "Ravi T.", checkout: "Jul 3" },
  { id: 202, type: "Standard", status: "occupied", guest: "Meera G.", checkout: "Jul 6" },
];

const reservations = [
  { id: "RES001", guest: "Rajesh Kumar", room: "Deluxe Room", checkin: "Jun 30", checkout: "Jul 3", nights: 3, amount: 7497, status: "confirmed" },
  { id: "RES002", guest: "Priya Sharma", room: "Executive Suite", checkin: "Jul 1", checkout: "Jul 5", nights: 4, amount: 21996, status: "confirmed" },
  { id: "RES003", guest: "Vikram Singh", room: "Deluxe Room", checkin: "Jul 1", checkout: "Jul 2", nights: 1, amount: 2499, status: "pending" },
  { id: "RES004", guest: "Ananya Patel", room: "Super Deluxe", checkin: "Jul 3", checkout: "Jul 7", nights: 4, amount: 13996, status: "confirmed" },
  { id: "RES005", guest: "Suresh Mishra", room: "Deluxe Room", checkin: "Jul 2", checkout: "Jul 4", nights: 2, amount: 4998, status: "pending" },
  { id: "RES006", guest: "Kavya Reddy", room: "Family Suite", checkin: "Jun 28", checkout: "Jul 1", nights: 3, amount: 13497, status: "cancelled" },
  { id: "RES007", guest: "Amit Jha", room: "Standard Room", checkin: "Jul 5", checkout: "Jul 7", nights: 2, amount: 3598, status: "pending" },
];

const enquiries = [
  { id: "ENQ001", name: "Rohan Gupta", phone: "+91 98765 11111", room: "Deluxe Room", date: "Jul 10–13", time: "2 hrs ago", status: "new" },
  { id: "ENQ002", name: "Sunita Devi", phone: "+91 87654 22222", room: "Family Suite", date: "Jul 15–20", time: "5 hrs ago", status: "new" },
  { id: "ENQ003", name: "Mohan Lal", phone: "+91 76543 33333", room: "Executive Suite", date: "Jul 8–9", time: "1 day ago", status: "contacted" },
];


const auditLog = [
  { id: 1, action: "Updated Room Rate", details: "Changed Deluxe Room rate to ₹2,499", user: "Master Admin", time: "10 mins ago" },
  { id: 2, action: "Confirmed Booking", details: "Booking RES005 confirmed", user: "Front Desk (Ravi)", time: "1 hour ago" },
  { id: 3, action: "Cancelled Booking", details: "Booking RES006 cancelled (Guest request)", user: "Master Admin", time: "3 hours ago" },
];

const roomRates = [
  { id: "std", category: "Standard Room", rate: 1799, available: true },
  { id: "dlx", category: "Deluxe Room", rate: 2499, available: true },
  { id: "sdlx", category: "Super Deluxe", rate: 3499, available: true },
  { id: "fam", category: "Family Suite", rate: 4499, available: true },
  { id: "exec", category: "Executive Suite", rate: 5499, available: false },
];

const statusColor = {
  confirmed: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", label: "Confirmed", icon: CheckCircle },
  pending: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24", label: "Pending", icon: Clock },
  cancelled: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", label: "Cancelled", icon: XCircle },
};

const roomStatusColor: Record<string, { bg: string; text: string }> = {
  occupied: { bg: "rgba(239,68,68,0.8)", text: "#fff" },
  vacant: { bg: "rgba(34,197,94,0.8)", text: "#fff" },
  maintenance: { bg: "rgba(251,191,36,0.8)", text: "#0F1E3C" },
};

export function AdminDashboard({ onLogout, onGuestPortal }: { onLogout: () => void; onGuestPortal: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const occupied = rooms.filter((r) => r.status === "occupied").length;
  const occupancyRate = Math.round((occupied / rooms.length) * 100);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "reservations", label: "Reservations", icon: FileText },
    { id: "rooms", label: "Room Map", icon: BedDouble },
    { id: "calendar", label: "Month Calendar", icon: CalendarDays },
    { id: "rates", label: "Rates & Inventory", icon: Settings },
    { id: "enquiries", label: "Enquiries", icon: Users },
    { id: "customizer", label: "Customizer", icon: Edit3 },
    { id: "audit", label: "Audit Log", icon: Activity },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#060F20", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-auto`}
        style={{ background: "#0A1830", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col h-full">
          <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-xs tracking-widest uppercase block" style={{ color: "#C9A84C" }}>Hotel</span>
            <span className="text-lg" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Kamla Inn Grand</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Admin Portal</span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
                  style={{
                    background: active ? "rgba(201,168,76,0.15)" : "transparent",
                    color: active ? "#C9A84C" : "rgba(255,255,255,0.5)",
                    borderLeft: active ? "2px solid #C9A84C" : "2px solid transparent",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <button
              onClick={onGuestPortal}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <Home size={16} /> Guest Portal
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
              style={{ color: "rgba(239,68,68,0.7)" }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-5 h-14"
          style={{ background: "rgba(6,15,32,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ color: "#fff", fontSize: "0.9rem", fontFamily: "'Playfair Display', serif" }}>
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
              style={{ background: "#C9A84C", color: "#0F1E3C", fontWeight: 700 }}
            >
              AD
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 lg:p-7">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Occupancy Rate", value: `${occupancyRate}%`, sub: `${occupied}/${rooms.length} rooms`, icon: BedDouble, color: "#C9A84C" },
                  { label: "Today's Revenue", value: "₹38,490", sub: "+12% vs yesterday", icon: TrendingUp, color: "#22c55e" },
                  { label: "Active Guests", value: occupied.toString(), sub: "checked in", icon: Users, color: "#60a5fa" },
                  { label: "Pending Enquiries", value: enquiries.filter((e) => e.status === "new").length.toString(), sub: "need response", icon: Calendar, color: "#fbbf24" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-xl p-5"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{stat.label}</span>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${stat.color}20` }}
                        >
                          <Icon size={15} color={stat.color} />
                        </div>
                      </div>
                      <div
                        className="text-2xl mb-0.5"
                        style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div
                  className="rounded-xl p-5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h3 className="text-sm mb-4" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                    Revenue Trend (6 months)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenueData}>
                      <defs key="defs-1">
                        <linearGradient id="hotel-rev-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop key="stop-1" offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                          <stop key="stop-2" offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid key="grid-1" strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis key="xaxis-1" dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis key="yaxis-1" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        key="tooltip-1"
                        contentStyle={{ background: "#0A1830", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, fontSize: 12, color: "#fff" }}
                        formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                      />
                      <Area key="area-1" type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#hotel-rev-grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h3 className="text-sm mb-4" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                    Monthly Bookings
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={revenueData} barSize={24}>
                      <CartesianGrid key="grid-2" strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis key="xaxis-2" dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis key="yaxis-2" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        key="tooltip-2"
                        contentStyle={{ background: "#0A1830", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, fontSize: 12, color: "#fff" }}
                      />
                      <Bar key="bar-2" dataKey="bookings" fill="#C9A84C" radius={[4, 4, 0, 0]} opacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent reservations preview */}
              <div
                className="rounded-xl p-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Recent Reservations</h3>
                  <button
                    onClick={() => setActiveTab("reservations")}
                    className="text-xs"
                    style={{ color: "#C9A84C" }}
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-2">
                  {reservations.slice(0, 4).map((res) => {
                    const s = statusColor[res.status as keyof typeof statusColor];
                    const Icon = s.icon;
                    return (
                      <div key={res.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                        <div>
                          <span className="text-sm" style={{ color: "#fff" }}>{res.guest}</span>
                          <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.35)" }}>{res.room}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>₹{res.amount.toLocaleString("en-IN")}</span>
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
                            <Icon size={10} />
                            {s.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div>
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                {[
                  { color: "rgba(34,197,94,0.8)", label: "Vacant" },
                  { color: "rgba(239,68,68,0.8)", label: "Occupied" },
                  { color: "rgba(251,191,36,0.8)", label: "Maintenance" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: l.color }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {rooms.map((room) => {
                  const s = roomStatusColor[room.status];
                  return (
                    <div
                      key={room.id}
                      className="rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                          {room.id}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: s.bg, color: s.text, fontWeight: 600 }}
                        >
                          {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-xs mb-1" style={{ color: "#C9A84C" }}>{room.type}</div>
                      {room.guest && (
                        <>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{room.guest}</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Out: {room.checkout}</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "reservations" && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl mb-1" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Reservations Ledger</h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Manage active bookings, generate receipts, and view history.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                    style={{ background: showArchived ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)", color: showArchived ? "#C9A84C" : "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Archive size={16} />
                    {showArchived ? "Hide Archived" : "View Archived"}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-white/10" style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <Download size={16} />
                    Export CSV
                  </button>
                  <button onClick={() => setShowWalkIn(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200" style={{ background: "#C9A84C", color: "#0F1E3C", fontWeight: 500 }}>
                    <Plus size={16} />
                    Walk-In Booking
                  </button>
                </div>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="p-4 border-b flex items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
                    <input type="text" placeholder="Search by name, phone, or ID..." className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                  </div>
                  <select className="px-4 py-2 rounded-lg text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", colorScheme: "dark" }}>
                    <option>All Room Types</option>
                  </select>
                  <input type="date" className="px-4 py-2 rounded-lg text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", colorScheme: "dark" }} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {["ID", "Guest", "Room", "Check-In", "Check-Out", "Nights", "Amount", "Status", "Actions"].map((h, i) => (
                          <th key={i} className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                            {h === "Actions" ? "" : h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.filter(r => showArchived ? r.status === "cancelled" : r.status !== "cancelled").map((res, i) => {
                        const s = statusColor[res.status as keyof typeof statusColor];
                        const Icon = s.icon;
                        return (
                          <tr
                            key={res.id}
                            className="border-b transition-colors hover:bg-white/[0.02]"
                            style={{ borderColor: "rgba(255,255,255,0.03)" }}
                          >
                            <td className="px-4 py-4" style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{res.id}</td>
                            <td className="px-4 py-4" style={{ color: "#fff" }}>{res.guest}</td>
                            <td className="px-4 py-4" style={{ color: "rgba(255,255,255,0.7)" }}>{res.room}</td>
                            <td className="px-4 py-4" style={{ color: "rgba(255,255,255,0.7)" }}>{res.checkin}</td>
                            <td className="px-4 py-4" style={{ color: "rgba(255,255,255,0.7)" }}>{res.checkout}</td>
                            <td className="px-4 py-4" style={{ color: "rgba(255,255,255,0.7)" }}>{res.nights}</td>
                            <td className="px-4 py-4" style={{ color: "#fff" }}>₹{res.amount.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs" style={{ background: s.bg, color: s.text }}>
                                <Icon size={12} /> {s.label}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button title="Edit Booking" className="p-1.5 rounded transition-colors hover:bg-white/10" style={{ color: "rgba(255,255,255,0.6)" }}><Edit3 size={16} /></button>
                                <button title="Print Receipt" className="p-1.5 rounded transition-colors hover:bg-white/10" style={{ color: "rgba(255,255,255,0.6)" }}><Printer size={16} /></button>
                                {showArchived ? (
                                  <button title="Restore Booking" className="p-1.5 rounded transition-colors hover:bg-green-500/20" style={{ color: "#22c55e" }}><Undo size={16} /></button>
                                ) : (
                                  <button title="Cancel & Archive" className="p-1.5 rounded transition-colors hover:bg-red-500/20" style={{ color: "#ef4444" }}><Archive size={16} /></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "enquiries" && (
            <div>
              <h2 className="text-base mb-5" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                Pending Enquiries
              </h2>
              <div className="space-y-3">
                {enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: "#fff" }}>{enq.name}</span>
                        {enq.status === "new" && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                            New
                          </span>
                        )}
                      </div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {enq.phone} · {enq.room} · {enq.date}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>{enq.time}</div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`tel:${enq.phone}`}
                        className="px-4 py-2 rounded-lg text-xs"
                        style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}
                      >
                        Call Now
                      </a>
                      <button
                        className="px-4 py-2 rounded-lg text-xs"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        Mark Contacted
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Month Availability</h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Month-at-a-glance occupancy view.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="px-3 py-1.5 rounded" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>Prev Month</button>
                  <span style={{ color: "#fff" }}>July 2026</span>
                  <button className="px-3 py-1.5 rounded" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>Next Month</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="p-2 text-center text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{day}</div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => {
                  const booked = Math.floor(Math.random() * 12);
                  const bg = booked > 8 ? "rgba(239,68,68,0.2)" : booked > 4 ? "rgba(251,191,36,0.2)" : "rgba(34,197,94,0.1)";
                  const color = booked > 8 ? "#ef4444" : booked > 4 ? "#fbbf24" : "#22c55e";
                  return (
                    <div key={i} className="rounded-lg p-3 min-h-[80px] flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-sm" style={{ color: "#fff" }}>{i + 1}</span>
                      <span className="text-xs px-2 py-1 rounded mt-2 text-center" style={{ background: bg, color }}>
                        {booked}/12 Booked
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "rates" && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl mb-1" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Rates & Inventory</h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Manage nightly rates and room availability.</p>
                </div>
                <button className="px-4 py-2 rounded-lg text-sm transition-all duration-200" style={{ background: "#C9A84C", color: "#0F1E3C", fontWeight: 500 }}>
                  Save Changes
                </button>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Category</th>
                      <th className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Nightly Rate (₹)</th>
                      <th className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomRates.map(r => (
                      <tr key={r.id} className="border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                        <td className="px-4 py-4" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>{r.category}</td>
                        <td className="px-4 py-4">
                          <input type="number" defaultValue={r.rate} className="px-3 py-1.5 rounded outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                        </td>
                        <td className="px-4 py-4">
                          <button className="px-3 py-1.5 rounded text-xs transition-colors" style={{ background: r.available ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: r.available ? "#22c55e" : "#ef4444" }}>
                            {r.available ? "Available" : "Archived / Unavailable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "customizer" && (
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h2 className="text-xl mb-1" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Branding & Content Customizer</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Owner's command center for identity, rules, and global copy.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-2">
                  {["Branding & Settings", "Global Content", "Booking Rules", "System Admin"].map((t, i) => (
                    <button key={t} className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all" style={{ background: i === 0 ? "rgba(201,168,76,0.1)" : "transparent", color: i === 0 ? "#C9A84C" : "rgba(255,255,255,0.7)" }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="md:col-span-3 rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <h3 className="text-base mb-6" style={{ color: "#fff" }}>Branding & Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Primary Accent Color</label>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full" style={{ background: "#C9A84C", border: "2px solid #fff" }} />
                        <span style={{ color: "#fff", fontFamily: "monospace" }}>#C9A84C</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Hotel Tagline</label>
                      <input type="text" defaultValue="Where Luxury Meets Warmth & Comfort" className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
                    </div>
                    <div>
                      <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Hero Image URL</label>
                      <input type="text" defaultValue="https://images.unsplash.com/photo-1775113895544-..." className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }} />
                    </div>
                    <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <button className="px-6 py-2.5 rounded-lg text-sm transition-all duration-200" style={{ background: "#C9A84C", color: "#0F1E3C", fontWeight: 500 }}>Save Branding Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h2 className="text-xl mb-1" style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Audit Action Log</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Tamper-evident historical record of every administrative action.</p>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <th className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Time</th>
                      <th className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Action</th>
                      <th className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Details</th>
                      <th className="text-left px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map(log => (
                      <tr key={log.id} className="border-b transition-colors hover:bg-white/[0.01]" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                        <td className="px-4 py-4" style={{ color: "rgba(255,255,255,0.5)" }}>{log.time}</td>
                        <td className="px-4 py-4" style={{ color: "#fff", fontWeight: 500 }}>{log.action}</td>
                        <td className="px-4 py-4" style={{ color: "rgba(255,255,255,0.7)" }}>{log.details}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 rounded text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "#C9A84C" }}>{log.user}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Walk-In Booking Modal */}
      {showWalkIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowWalkIn(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: "#0A1830", border: "1px solid rgba(201,168,76,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ color: "#fff", fontFamily: "'Playfair Display', serif" }}>Walk-In Booking</h3>
              <button onClick={() => setShowWalkIn(false)} style={{ color: "rgba(255,255,255,0.4)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Guest Name", placeholder: "Full name" },
                { label: "Phone", placeholder: "+91 XXXXX XXXXX" },
                { label: "Check-In", placeholder: "Date", type: "date" },
                { label: "Check-Out", placeholder: "Date", type: "date" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{f.label}</label>
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", colorScheme: "dark" }}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Room Type</label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg outline-none text-sm"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", colorScheme: "dark" }}
                >
                  {["Standard Room — ₹1,799", "Deluxe Room — ₹2,499", "Super Deluxe — ₹3,499", "Family Suite — ₹4,499", "Executive Suite — ₹5,499"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-3 rounded-lg text-sm"
                style={{ background: "#C9A84C", color: "#0F1E3C", fontWeight: 700 }}
                onClick={() => setShowWalkIn(false)}
              >
                Confirm Booking
              </button>
              <button
                className="px-5 py-3 rounded-lg text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                onClick={() => setShowWalkIn(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
