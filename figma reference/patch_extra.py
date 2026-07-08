import re
with open("src/app/components/AdminDashboard.tsx", "r") as f:
    code = f.read()

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

target = "        </div>\n      </div>\n\n      {/* Walk-In Booking Modal */}"
if target in code:
    code = code.replace(target, extra_blocks + "\n" + target)
    with open("src/app/components/AdminDashboard.tsx", "w") as f:
        f.write(code)
    print("Patched successfully")
else:
    print("Target not found")
