import { useState } from "react";
import { ScrollText, ShieldAlert, User, Users } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { SettingsAudit } from "../SettingsAudit";
import { StaffManagementPanel } from "./StaffManagementPanel";
import { DangerZonePanel } from "./DangerZonePanel";
import { MyProfileTab } from "./MyProfileTab";

type SubTab = "profile" | "staff" | "audit" | "danger";

export function SystemAdministrationTab() {
  const { role } = useAuth();
  const [subTab, setSubTab] = useState<SubTab>("profile");

  const tabButtonClasses = (tab: SubTab) =>
    `flex items-center gap-2 border-b-2 px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-300 ${
      subTab === tab
        ? "border-primary text-primary"
        : "border-transparent text-white/50 hover:text-white/80"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-white/10">
        <button
          type="button"
          onClick={() => setSubTab("profile")}
          className={tabButtonClasses("profile")}
        >
          <User size={14} />
          My Profile
        </button>
        <button
          type="button"
          onClick={() => setSubTab("staff")}
          className={tabButtonClasses("staff")}
        >
          <Users size={14} />
          Staff Management
        </button>
        <button
          type="button"
          onClick={() => setSubTab("audit")}
          className={tabButtonClasses("audit")}
        >
          <ScrollText size={14} />
          System Audit Log
        </button>
        {role === "master_admin" && (
          <button
            type="button"
            onClick={() => setSubTab("danger")}
            className={tabButtonClasses("danger")}
          >
            <ShieldAlert size={14} />
            Database Controls
          </button>
        )}
      </div>

      {subTab === "profile" && <MyProfileTab />}
      {subTab === "staff" && <StaffManagementPanel />}
      {subTab === "audit" && <SettingsAudit />}
      {subTab === "danger" && <DangerZonePanel />}
    </div>
  );
}
