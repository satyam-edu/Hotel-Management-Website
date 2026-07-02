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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<StaffRoleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setRole(await fetchRole());
      }
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        setRole(nextSession ? await fetchRole() : null);
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

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        isLoading,
        login,
        logout,
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
