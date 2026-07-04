import { useState } from "react";
import { Mail, ScrollText, Trash2, User, Users } from "lucide-react";
import { SettingsAudit } from "./SettingsAudit";

type SettingsTab = "staff" | "audit";
type StaffAccountRole = "master_admin" | "head_admin" | "sub_admin";

interface StaffAccount {
  id: string;
  fullName: string;
  email: string;
  role: StaffAccountRole;
  isProtected?: boolean;
}

const STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: "staff-1",
    fullName: "Harsh Tiwari",
    email: "admin@kamalainngrand.com",
    role: "master_admin",
    isProtected: true,
  },
  {
    id: "staff-2",
    fullName: "Priya Nair",
    email: "priya@kamalainngrand.com",
    role: "head_admin",
  },
  {
    id: "staff-3",
    fullName: "Suresh Kumar",
    email: "suresh@kamalainngrand.com",
    role: "sub_admin",
  },
];

const ROLE_BADGE_STYLES: Record<StaffAccountRole, string> = {
  master_admin: "bg-primary/10 text-primary border-primary/25",
  head_admin: "bg-blue-400/10 text-blue-300 border-blue-400/25",
  sub_admin: "bg-white/10 text-white/60 border-white/15",
};

const ROLE_LABELS: Record<StaffAccountRole, string> = {
  master_admin: "Master Admin",
  head_admin: "Head Admin",
  sub_admin: "Sub Admin",
};

const inputClasses =
  "w-full rounded-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors duration-300 focus:border-primary";

const labelClasses = "mb-1.5 flex items-center gap-1.5 text-xs tracking-wide text-white/50";

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("staff");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">
          Settings &amp; Audit
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Branding, booking rules, staff accounts, and the audit log.
        </p>
      </div>

      <div className="flex gap-2 border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-300 ${
            activeTab === "staff"
              ? "border-primary text-primary"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          <Users size={14} />
          Staff Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs uppercase tracking-widest transition-colors duration-300 ${
            activeTab === "audit"
              ? "border-primary text-primary"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          <ScrollText size={14} />
          System Audit Log
        </button>
      </div>

      {activeTab === "staff" ? <StaffManagementPanel /> : <SettingsAudit />}
    </div>
  );
}

function StaffManagementPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <form className="glass-panel h-fit rounded-xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-white">
          Register New Staff
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="fullName" className={labelClasses}>
              <User size={14} />
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              placeholder="Full name"
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="staffEmail" className={labelClasses}>
              <Mail size={14} />
              Email
            </label>
            <input
              id="staffEmail"
              type="email"
              required
              placeholder="staff@kamalainngrand.com"
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="tempPassword" className={labelClasses}>
              Temporary Password
            </label>
            <input
              id="tempPassword"
              type="password"
              required
              placeholder="••••••••"
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="staffRole" className={labelClasses}>
              Role
            </label>
            <select id="staffRole" className={inputClasses}>
              <option value="head_admin" className="bg-background-dark">
                Head Administrator
              </option>
              <option value="sub_admin" className="bg-background-dark">
                Sub Administrator
              </option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="mt-7 w-full rounded-sm bg-primary py-3 text-xs font-bold uppercase tracking-[0.15em] text-background-dark transition-opacity duration-300 hover:opacity-90"
        >
          Create Account
        </button>
      </form>

      <div className="glass-panel rounded-xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-white">
          Active Staff
        </h2>

        <ul className="mt-6 space-y-3">
          {STAFF_ACCOUNTS.map((staff) => (
            <li
              key={staff.id}
              className="flex items-center justify-between rounded-sm border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {staff.fullName}
                </p>
                <p className="mt-0.5 text-xs text-white/50">{staff.email}</p>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${ROLE_BADGE_STYLES[staff.role]}`}
                >
                  {ROLE_LABELS[staff.role]}
                </span>

                {!staff.isProtected && (
                  <button
                    type="button"
                    aria-label={`Revoke access for ${staff.fullName}`}
                    className="rounded-sm p-2 text-white/40 transition-colors duration-300 hover:bg-red-400/10 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

