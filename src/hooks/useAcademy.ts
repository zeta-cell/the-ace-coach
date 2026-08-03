import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Academy {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  owner_id: string;
}

export interface AcademyCoach {
  id: string;
  coach_id: string;
  club_role: string;
  joined_at: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

/**
 * A coach "Academy" is a club owned or managed by the coach.
 * It can span several locations (club_locations) and several coaches (club_coaches).
 */
export const useAcademy = () => {
  const { user } = useAuth();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [coaches, setCoaches] = useState<AcademyCoach[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoster = useCallback(async (clubId: string) => {
    const { data: rows } = await supabase
      .from("club_coaches")
      .select("id, coach_id, club_role, joined_at")
      .eq("club_id", clubId);

    const ids = (rows || []).map((r) => r.coach_id);
    let profiles: any[] = [];
    if (ids.length) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", ids);
      profiles = data || [];
    }
    setCoaches(
      (rows || []).map((r) => {
        const p = profiles.find((x) => x.user_id === r.coach_id);
        return {
          ...r,
          full_name: p?.full_name || "Coach",
          email: p?.email ?? null,
          avatar_url: p?.avatar_url ?? null,
        };
      }),
    );
  }, []);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1. Academy owned by this coach
    const { data: owned } = await supabase
      .from("clubs")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let found = (owned as Academy | null) ?? null;
    let manager = !!owned;

    // 2. Otherwise an academy where the coach is a manager
    if (!found) {
      const { data: membership } = await supabase
        .from("club_coaches")
        .select("club_id, club_role, clubs!inner(*)")
        .eq("coach_id", user.id)
        .in("club_role", ["owner", "manager"])
        .limit(1)
        .maybeSingle();
      if (membership) {
        found = (membership as any).clubs as Academy;
        manager = true;
      }
    }

    setAcademy(found);
    setIsManager(manager);
    if (found) await loadRoster(found.id);
    else setCoaches([]);
    setLoading(false);
  }, [user, loadRoster]);

  useEffect(() => {
    load();
  }, [load]);

  return { academy, coaches, isManager, loading, reload: load };
};
