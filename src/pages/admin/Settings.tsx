import { useState } from "react";
import { ClipboardList, FileText, Palette, ShieldCheck } from "lucide-react";
import { BrandingSettingsTab } from "./settings/BrandingSettingsTab";
import { GlobalContentTab } from "./settings/GlobalContentTab";
import { BookingRulesTab } from "./settings/BookingRulesTab";
import { SystemAdministrationTab } from "./settings/SystemAdministrationTab";

type SettingsTab = "branding" | "content" | "booking" | "system";

const TABS: { id: SettingsTab; label: string; icon: typeof Palette }[] = [
  { id: "branding", label: "Branding & Settings", icon: Palette },
  { id: "content", label: "Global Content", icon: FileText },
  { id: "booking", label: "Booking Rules", icon: ClipboardList },
  { id: "system", label: "System Administration", icon: ShieldCheck },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("branding");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Branding, site content, booking rules, staff accounts, and the audit log.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-300 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "branding" && <BrandingSettingsTab />}
      {activeTab === "content" && <GlobalContentTab />}
      {activeTab === "booking" && <BookingRulesTab />}
      {activeTab === "system" && <SystemAdministrationTab />}
    </div>
  );
}
