import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { useClub } from "@/hooks/useClub";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Mail, Users } from "lucide-react";

interface MemberRow {
  id: string;
  user_id: string;
  followed_at: string;
  full_name?: string;
  email?: string;
}

const ClubMembers = () => {
  const { activeClub, activeClubId } = useClub();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClubId) return;
    (async () => {
      setLoading(true);
      const { data: follows } = await supabase
        .from("club_followers")
        .select("id, user_id, followed_at")
        .eq("club_id", activeClubId)
        .order("followed_at", { ascending: false });

      const ids = (follows || []).map((m) => m.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids)
        : { data: [] };

      setMembers((follows || []).map((m) => ({
        ...m,
        full_name: profiles?.find((p: any) => p.user_id === m.user_id)?.full_name,
        email: profiles?.find((p: any) => p.user_id === m.user_id)?.email,
      })));
      setLoading(false);
    })();
  }, [activeClubId]);

  if (!activeClub) return <PortalLayout><div className="p-6">No club found.</div></PortalLayout>;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">Members</h1>
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mt-1">Players connected to your club</p>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-primary" />
            <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground">Active Members ({members.length})</h2>
          </div>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs shrink-0">
                      {m.full_name?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-body text-foreground truncate">{m.full_name || m.user_id.slice(0, 8)}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate"><Mail size={12} /> {m.email || "No email"}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0"><Heart size={12} className="mr-1 text-primary" /> Member</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ClubMembers;