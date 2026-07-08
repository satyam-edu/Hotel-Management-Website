#!/bin/bash
# I will use a python script to handle the patching reliably.
cat << 'PYEOF' > patch_admin.py
import re
import sys

with open("src/app/components/AdminDashboard.tsx", "r") as f:
    code = f.read()

# 1. Update lucide-react imports
code = re.sub(
    r'Download, Plus, Eye\n} from "lucide-react";',
    'Download, Plus, Eye, Edit3, Activity, CalendarDays, Printer, Archive, RefreshCw, Undo, Search\n} from "lucide-react";',
    code
)

# 2. Add sample data for Audit Log and Rates
sample_data = """
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
"""
code = code.replace("const statusColor =", sample_data + "\nconst statusColor =")

# 3. Update the state and navItems
nav_replacement = """
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
"""
code = re.sub(
    r'const \[sidebarOpen, setSidebarOpen\] = useState\(false\);[\s\S]*?\] as const;',
    nav_replacement.strip(),
    code
)

# 4. Enhance the Reservations Tab to include Export, Archiving, Edit, and Receipt buttons
# We will find the Reservations section block and replace it.
reservations_content = """
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
"""

# Find the block for activeTab === "reservations" and replace it
pattern_reservations = r'\{activeTab === "reservations" && \([\s\S]*?\}\)\}\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)'
code = re.sub(pattern_reservations, '{activeTab === "reservations" && (' + reservations_content + ')}', code)

# 5. Add blocks for "calendar", "rates", "customizer", "audit" right after "enquiries" block
extra_blocks = """
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
"""

pattern_enquiries = r'\{activeTab === "enquiries" && \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>\s*<\/div>'
# Need to append the new blocks after enquiries block and before walk-in modal
match = re.search(pattern_enquiries, code)
if match:
    enquiries_block = match.group(0)
    # The block ends with </div> </div> </div>
    # We want to replace it with the enquiries block PLUS our extra_blocks
    # Careful not to destroy the closing tags of the main layout.
    # Actually, pattern_enquiries matches till the end of the main tab container.
    # Let's adjust pattern:
    
    pattern_enquiries_inner = r'\{activeTab === "enquiries" && \([\s\S]*?\}\)\}'
    match_inner = re.search(pattern_enquiries_inner, code)
    if match_inner:
        code = code[:match_inner.end()] + "\n" + extra_blocks + code[match_inner.end():]

with open("src/app/components/AdminDashboard.tsx", "w") as f:
    f.write(code)

PYEOF
python3 patch_admin.py
