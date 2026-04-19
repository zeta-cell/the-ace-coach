import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

const ClubInvite = () => {
  const { token } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await supabase
        .from("club_invites")
        .select("*, clubs(name, logo_url, city)")
        .eq("token", token)
        .maybeSingle();
      if (data) {
        setInvite(data);
        setClub(data.clubs);
      }
      setLoading(false);
    })();
  }, [token]);

  const accept = async () => {
    if (!user || !invite) { navigate("/login"); return; }
    if (profile?.email?.toLowerCase() !== invite.email.toLowerCase()) {
      toast.error("This invite is for a different email address");
      return;
    }
    const { error } = await supabase.from("club_coaches").insert({
      club_id: invite.club_id,
      coach_id: user.id,
      club_role: invite.club_role,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("club_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
    toast.success("Joined the club!");
    navigate("/club");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading…</div>;
  if (!invite) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Invite not found or expired.</p></div>;

  const expired = new Date(invite.expires_at) < new Date();
  const accepted = !!invite.accepted_at;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <Building2 size={48} className="mx-auto text-primary" />
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">{club?.name}</h1>
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mt-1">{club?.city}</p>
        </div>
        <p className="text-sm font-body text-muted-foreground">
          You've been invited to join <strong className="text-foreground">{club?.name}</strong> as a <strong className="text-foreground">{invite.club_role}</strong>.
        </p>
        {accepted ? <p className="text-sm text-accent">Already accepted</p> :
         expired ? <p className="text-sm text-destructive">This invite has expired</p> :
         !user ? <Button onClick={() => navigate("/login")} className="w-full">Sign in to Accept</Button> :
         <Button onClick={accept} className="w-full">Accept Invitation</Button>}
      </Card>
    </div>
  );
};

export default ClubInvite;
