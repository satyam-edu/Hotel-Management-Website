import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { StaffRoleType } from "../types/database";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: StaffRoleType | null;
  staffUsername: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_LABELS: Record<StaffRoleType, string> = {
  master_admin: "Master Admin",
  head_admin: "Head Admin",
  sub_admin: "Sub Admin",
};

export function formatRoleLabel(role: StaffRoleType | null): string {
  return role ? ROLE_LABELS[role] : "Unknown Role";
}

async function fetchRole(): Promise<StaffRoleType | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("current_staff_role");

  if (error) {
    console.error("Failed to fetch staff role:", error.message);
    return null;
  }

  return data;
}

// staff_roles.username is not part of the JWT, so the sign-in identity
// (email/role) and the display username are fetched separately — this is
// the single dynamic source "My Profile" and the admin header read from,
// replacing any hardcoded identity literal.
async function fetchUsername(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("staff_roles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch staff username:", error.message);
    return null;
  }

  return data?.username ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<StaffRoleType | null>(null);
  const [staffUsername, setStaffUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile(userId: string) {
    const [nextRole, nextUsername] = await Promise.all([
      fetchRole(),
      fetchUsername(userId),
    ]);
    setRole(nextRole);
    setStaffUsername(nextUsername);
  }

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      if (data.session) {
        await loadProfile(data.session.user.id);
      }
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        if (nextSession) {
          await loadProfile(nextSession.user.id);
        } else {
          setRole(null);
          setStaffUsername(null);
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    if (!supabase) {
      return { error: "Authentication service is not configured." };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error ? error.message : null };
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  // Called after a "My Profile" save so the header/session immediately
  // reflect a changed username or email rather than waiting for the next
  // full page load or auth state event.
  async function refreshProfile() {
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session) {
      await loadProfile(data.session.user.id);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        staffUsername,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
