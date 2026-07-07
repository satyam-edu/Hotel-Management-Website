import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { hexToRgbString, shadeColor } from "../lib/color";
import type { SystemConfiguration } from "../types/database";

interface SystemContextValue {
  config: SystemConfiguration;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DEFAULT_CONFIG: SystemConfiguration = {
  id: 1,
  primary_gold: "#c5a880",
  bg_charcoal: "#0b132b",
  base_font_size: 16,
  hero_bg_url: null,
  about_photo_url: null,
  min_booking_age: 12,
  max_adults_per_room: 2,
  max_children_per_room: 2,
  check_in_time: "13:00",
  check_out_time: "11:00",
  cancellation_policy: "",
  tax_rate: 12,
  tax_id: "",
  invoice_terms: "",
  maintenance_mode: false,
  updated_at: new Date().toISOString(),
};

const SystemContext = createContext<SystemContextValue | undefined>(
  undefined,
);

function applyThemeVariables(config: SystemConfiguration): void {
  const root = document.documentElement;

  root.style.setProperty("--color-primary", config.primary_gold);
  root.style.setProperty(
    "--color-primary-light",
    shadeColor(config.primary_gold, 0.25),
  );
  root.style.setProperty(
    "--color-primary-dark",
    shadeColor(config.primary_gold, -0.25),
  );
  root.style.setProperty(
    "--color-primary-rgb",
    hexToRgbString(config.primary_gold),
  );

  root.style.setProperty("--color-background", config.bg_charcoal);
  root.style.setProperty(
    "--color-background-light",
    shadeColor(config.bg_charcoal, 0.25),
  );
  root.style.setProperty(
    "--color-background-dark",
    shadeColor(config.bg_charcoal, -0.25),
  );
  root.style.setProperty(
    "--color-background-rgb",
    hexToRgbString(config.bg_charcoal),
  );

  root.style.setProperty("--font-size-base", `${config.base_font_size}px`);
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfiguration>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadConfig() {
    if (!supabase) {
      applyThemeVariables(DEFAULT_CONFIG);
      setIsLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("system_configurations")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (fetchError) {
      // PostgREST returns 401/403-style codes for RLS denials, not a silent
      // empty result — maybeSingle() only suppresses the "0 rows" 406, so a
      // real fetchError here means something other than a missing row.
      console.error(
        "system_configurations query failed — likely an RLS policy is blocking this read (check the system_configurations_select_anon policy):",
        fetchError.message,
      );
      applyThemeVariables(DEFAULT_CONFIG);
      setError(fetchError.message);
      setIsLoading(false);
      return;
    }

    if (!data) {
      console.error(
        "system_configurations returned zero rows for id=1 — the table has not been seeded. " +
          "Run the seed migration (supabase/migrations/0013_seed_system_configurations.sql) " +
          "in the Supabase SQL editor to insert the default config row.",
      );
      applyThemeVariables(DEFAULT_CONFIG);
      setError("Site configuration has not been set up yet.");
      setIsLoading(false);
      return;
    }

    applyThemeVariables(data);
    setConfig(data);
    setError(null);
    setIsLoading(false);
  }

  useEffect(() => {
    loadConfig();
  }, []);

  // Live-syncs branding/booking-rule/maintenance-mode changes made from the
  // admin Customizer to every open guest tab instantly, with no reload —
  // the payload's `new` row is already the full authoritative row for this
  // singleton table, so it's applied directly rather than re-fetching.
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const channel = client
      .channel("system_configurations_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_configurations", filter: "id=eq.1" },
        (payload) => {
          const nextConfig = payload.new as SystemConfiguration;
          if (!nextConfig || Object.keys(nextConfig).length === 0) return;
          applyThemeVariables(nextConfig);
          setConfig(nextConfig);
          setError(null);
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return <div className="sync-loading" aria-hidden="true" />;
  }

  return (
    <SystemContext.Provider value={{ config, isLoading, error, refresh: loadConfig }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystemContext(): SystemContextValue {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error("useSystemContext must be used within a SystemProvider");
  }
  return context;
}
