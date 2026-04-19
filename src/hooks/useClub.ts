import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClubMembership {
  club_id: string;
  club_role: "owner" | "manager" | "coach";
  club_name: string;
  club_slug: string | null;
  logo_url: string | null;
}

export const useClub = () => {
  const { user, role } = useAuth();
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      // Memberships via club_coaches (manager/coach of someone else's club)
      const { data: memberRows } = await supabase
        .from("club_coaches")
        .select("club_id, club_role, clubs!inner(id, name, slug, logo_url)")
        .eq("coach_id", user.id);

      // Clubs owned directly via clubs.owner_id — critical for club_manager
      // who created their own club (not necessarily in club_coaches).
      const { data: ownedRows } = await supabase
        .from("clubs")
        .select("id, name, slug, logo_url")
        .eq("owner_id", user.id)
        .eq("is_active", true);

      const seen = new Set<string>();
      const list: ClubMembership[] = [];

      (ownedRows || []).forEach((c: any) => {
        if (seen.has(c.id)) return;
        seen.add(c.id);
        list.push({
          club_id: c.id,
          club_role: "owner",
          club_name: c.name,
          club_slug: c.slug,
          logo_url: c.logo_url,
        });
      });

      (memberRows || []).forEach((row: any) => {
        if (seen.has(row.club_id)) return;
        seen.add(row.club_id);
        list.push({
          club_id: row.club_id,
          club_role: row.club_role,
          club_name: row.clubs.name,
          club_slug: row.clubs.slug,
          logo_url: row.clubs.logo_url,
        });
      });

      setMemberships(list);
      if (list.length > 0) setActiveClubId(list[0].club_id);
      setLoading(false);
    })();
  }, [user]);

  const isManager = memberships.some((m) => m.club_role !== "coach") || role === "club_manager";
  const activeClub = memberships.find((m) => m.club_id === activeClubId) || null;

  return { memberships, activeClubId, setActiveClubId, activeClub, isManager, loading };
};
