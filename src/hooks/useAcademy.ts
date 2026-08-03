import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Academy {
  id: string;
  club_id: string;
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
  academy_role: string;
  joined_at: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

export interface ManagedClub {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  has_academy: boolean;
}

/**
 * An Academy always belongs to exactly ONE club (a club can own at most one academy),
 * but it can operate in several clubs (academy_clubs) with several coaches (academy_coaches).
 * Only club owners/managers can create an academy. Courts stay a club-only feature.
 */
export const useAcademy = () => {
  const { user } = useAuth();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [coaches, setCoaches] = useState<AcademyCoach[]>([]);
  const [managedClubs, setManagedClubs] = useState<ManagedClub[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoster = useCallback(async (academyId: string) => {
    const { data: rows } = await supabase
      .from("academy_coaches")
      .select("id, coach_id, academy_role, joined_at")
      .eq("academy_id", academyId);

    const ids = (rows || []).map((r) => r.coach_id);
    let profiles: { user_id: string; full_name: string; email: string | null; avatar_url: string | null }[] = [];
    if (ids.length) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", ids);
      profiles = (data || []) as typeof profiles;
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

    // Clubs the user owns or manages — required to create an academy
    const [{ data: owned }, { data: memberships }] = await Promise.all([
      supabase.from("clubs").select("id, name, address, city, country").eq("owner_id", user.id).eq("is_active", true),
      supabase
        .from("club_coaches")
        .select("club_role, clubs!inner(id, name, address, city, country, is_active)")
        .eq("coach_id", user.id)
        .in("club_role", ["owner", "manager"]),
    ]);

    const clubMap = new Map<string, Omit<ManagedClub, "has_academy">>();
    (owned || []).forEach((c) => clubMap.set(c.id, c));
    (memberships || []).forEach((m) => {
      const c = (m as unknown as { clubs: { id: string; name: string; address: string | null; city: string | null; country: string | null; is_active: boolean } }).clubs;
      if (c?.is_active) clubMap.set(c.id, { id: c.id, name: c.name, address: c.address, city: c.city, country: c.country });
    });
    const clubIds = [...clubMap.keys()];

    // Academy of one of those clubs, or an academy the user is in the roster of
    let found: Academy | null = null;
    let manager = false;

    if (clubIds.length) {
      const { data } = await supabase
        .from("academies")
        .select("*")
        .in("club_id", clubIds)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        found = data as Academy;
        manager = true;
      }
    }

    if (!found) {
      const { data: roster } = await supabase
        .from("academy_coaches")
        .select("academy_role, academies!inner(*)")
        .eq("coach_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (roster) {
        found = (roster as unknown as { academies: Academy }).academies;
        manager = ["owner", "manager"].includes((roster as { academy_role: string }).academy_role);
      }
    }

    const academyClubId = found?.club_id;
    setManagedClubs([...clubMap.values()].map((c) => ({ ...c, has_academy: c.id === academyClubId })));
    setAcademy(found);
    setIsManager(manager);
    if (found) await loadRoster(found.id);
    else setCoaches([]);
    setLoading(false);
  }, [user, loadRoster]);

  useEffect(() => {
    load();
  }, [load]);

  const availableClubs = managedClubs.filter((c) => !c.has_academy);

  return {
    academy,
    coaches,
    isManager,
    loading,
    managedClubs,
    availableClubs,
    canCreateAcademy: availableClubs.length > 0,
    reload: load,
  };
};
