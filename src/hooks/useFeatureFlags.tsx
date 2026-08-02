import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  key: string;
  label: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  coming_soon: boolean;
}

interface FeatureFlagsContextType {
  flags: Record<string, FeatureFlag>;
  loading: boolean;
  isEnabled: (key: string) => boolean;
  isComingSoon: (key: string) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: {},
  loading: true,
  isEnabled: () => true,
  isComingSoon: () => false,
  refresh: async () => {},
});

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

/** Convenience hook: is a single feature switched on? */
export const useFeature = (key: string) => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(key);
};

export const FeatureFlagsProvider = ({ children }: { children: ReactNode }) => {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("feature_flags")
      .select("key, label, description, category, is_enabled, coming_soon");
    const map: Record<string, FeatureFlag> = {};
    (data || []).forEach((f) => {
      map[f.key] = f as FeatureFlag;
    });
    setFlags(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // If a flag row is missing we default to enabled so nothing breaks silently.
  const isEnabled = (key: string) => flags[key]?.is_enabled ?? true;
  const isComingSoon = (key: string) => flags[key]?.coming_soon ?? false;

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, isComingSoon, refresh }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};
