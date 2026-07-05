import { useState } from "react";
import { ScrollText, Users } from "lucide-react";
import { SettingsAudit } from "../SettingsAudit";
import { StaffManagementPanel } from "./StaffManagementPanel";

type SubTab = "staff" | "audit";

export function SystemAdministrationTab() {
  const [subTab, setSubTab] = useState<SubTab>("staff");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-white/10">
        <button
          type="button"
          onClick={() => setSubTab("staff")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-300 ${
            subTab === "staff"
              ? "border-primary text-primary"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          <Users size={14} />
          Staff Management
        </button>
        <button
          type="button"
          onClick={() => setSubTab("audit")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-300 ${
            subTab === "audit"
              ? "border-primary text-primary"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          <ScrollText size={14} />
          System Audit Log
        </button>
      </div>

      {subTab === "staff" ? <StaffManagementPanel /> : <SettingsAudit />}
    </div>
  );
}
