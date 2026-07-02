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
  config: SystemConfiguration | null;
  isLoading: boolean;
  error: string | null;
}

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

  root.style.setProperty(
    "--font-size-base",
    `${config.base_font_size}px`,
  );
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      const { data, error: fetchError } = await supabase
        .from("system_configurations")
        .select("*")
        .eq("id", 1)
        .single();

      if (!isMounted) return;

      if (fetchError || !data) {
        setError(fetchError?.message ?? "Failed to load site configuration.");
        setIsLoading(false);
        return;
      }

      applyThemeVariables(data);
      setConfig(data);
      setIsLoading(false);
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="sync-loading" aria-hidden="true" />;
  }

  return (
    <SystemContext.Provider value={{ config, isLoading, error }}>
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
