import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loadSiteContent } from "../lib/siteContent";
import type { SiteContent } from "../types/database";

interface SiteContentContextValue {
  content: SiteContent;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_CONTENT: SiteContent = {
  id: 1,
  hero_title: "Hotel Kamala Inn Grand",
  hero_subtitle:
    "Where every stay, celebration, and gathering is treated with the warmth of home and the polish of a landmark address.",
  hero_cta: "Book Your Stay",
  about_history:
    "Set along the NH-28 bypass in Padrauna, Hotel Kamala Inn Grand has grown into one of the district's most trusted addresses for travellers, families, and celebrations alike. What began as a modest wayside stop has become a full service property known for its banquet halls, event lawns, and genuinely warm service a reputation built one stay, one wedding, one gathering at a time.",
  about_philosophy:
    "Our philosophy is simple: every guest should feel looked after, not processed. From a family arriving late off the highway to a wedding party hosting three hundred guests, the same attention to comfort, cleanliness, and courtesy carries through every corner of the property.",
  rooms_intro:
    "From a quiet overnight stop to an extended family visit, every category is kept spotless, comfortable, and ready.",
  gallery_header: "A Closer Look at the Property",
  featured_review: "",
  updated_at: new Date().toISOString(),
};

const SiteContentContext = createContext<SiteContentContextValue | undefined>(
  undefined,
);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const result = await loadSiteContent();
      if (result.data) {
        setContent(result.data);
      }
      setError(result.error);
      setIsLoading(false);
    }

    load();
  }, []);

  return (
    <SiteContentContext.Provider value={{ content, isLoading, error }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContentContextValue {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error("useSiteContent must be used within a SiteContentProvider");
  }
  return context;
}
