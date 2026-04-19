import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { useClub } from "@/hooks/useClub";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Copy, Trash2, Crown, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface CoachRow {
  id: string;
  coach_id: string;
  club_role: string;
  joined_at: string;
  full_name?: string;
  email?: string;
}

interface InviteRow {
  id: string;
  email: string;
  token: string;
  club_role: string;
  expires_at: string;
  accepted_at: string | null;
}

const ClubCoaches = () => {
  const { activeClub, activeClubId } = useClub();
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"coach" | "manager">("coach");
  const [linkEmail, setLinkEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!activeClubId) return;
    setLoading(true);
    const { data: cd } = await supabase
      .from("club_coaches")
      .select("id, coach_id, club_role, joined_at")
      .eq("club_id", activeClubId);

    const coachIds = (cd || []).map((c) => c.coach_id);
    let profiles: any[] = [];
    if (coachIds.length) {
      const { data: pd } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", coachIds);
      profiles = pd || [];
    }
    const enriched = (cd || []).map((c) => ({
      ...c,
      full_name: profiles.find((p) => p.user_id === c.coach_id)?.full_name,
      email: profiles.find((p) => p.user_id === c.coach_id)?.email,
    }));
    setCoaches(enriched);

    const { data: id } = await supabase
      .from("club_invites")
      .select("*")
      .eq("club_id", activeClubId)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    setInvites(id || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [activeClubId]);

  const handleInvite = async () => {
    if (!activeClubId || !inviteEmail || !user) return;
    const { data, error } = await supabase
      .from("club_invites")
      .insert({
        club_id: activeClubId,
        email: inviteEmail.toLowerCase(),
        invited_by: user.id,
        club_role: inviteRole,
      })
      .select("token")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const link = `${window.location.origin}/club-invite/${data.token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Invite created and link copied");
    setInviteEmail("");
    setInviteOpen(false);
    load();
  };

  const handleLinkExisting = async () => {
    if (!activeClubId || !linkEmail) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", linkEmail.toLowerCase())
      .maybeSingle();
    if (!profile) {
      toast.error("No account found with that email");
      return;
    }
    const { error } = await supabase
      .from("club_coaches")
      .insert({ club_id: activeClubId, coach_id: profile.user_id, club_role: "coach" });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Coach linked to club");
    setLinkEmail("");
    setLinkOpen(false);
    load();
  };

  const removeCoach = async (id: string) => {
    if (!confirm("Remove this coach from the club?")) return;
    const { error } = await supabase.from("club_coaches").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); load(); }
  };

  const copyInvite = (token: string) => {
    const link = `${window.location.origin}/club-invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  const roleIcon = (r: string) => r === "owner" ? <Crown size={14} className="text-primary" /> : r === "manager" ? <Shield size={14} className="text-accent" /> : <User size={14} className="text-muted-foreground" />;

  if (!activeClub) return <PortalLayout><div className="p-6">No club found.</div></PortalLayout>;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">Coaches</h1>
          <div className="flex gap-2">
            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><UserPlus size={14} className="mr-2" /> Link Existing</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Link Existing Coach</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Coach email</Label>
                    <Input value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="coach@example.com" />
                    <p className="text-xs text-muted-foreground mt-1">The coach must already have an account.</p>
                  </div>
                  <Button onClick={handleLinkExisting} className="w-full">Link to Club</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus size={14} className="mr-2" /> Invite New</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite New Coach</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Email</Label>
                    <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="coach@example.com" />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInvite} className="w-full">Create Invite & Copy Link</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Active coaches */}
        <Card className="p-5">
          <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-3">Active Roster ({coaches.length})</h2>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : coaches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No coaches yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {coaches.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs">
                      {c.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="text-sm font-body text-foreground flex items-center gap-2">{c.full_name || c.coach_id.slice(0, 8)} {roleIcon(c.club_role)}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </div>
                  </div>
                  {c.club_role !== "owner" && (
                    <Button variant="ghost" size="sm" onClick={() => removeCoach(c.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending invites */}
        {invites.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-3">Pending Invites ({invites.length})</h2>
            <div className="divide-y divide-border">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-body text-foreground">{i.email}</div>
                    <div className="text-xs text-muted-foreground">Role: {i.club_role} · Expires {new Date(i.expires_at).toLocaleDateString()}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyInvite(i.token)}>
                    <Copy size={14} className="mr-1" /> Copy Link
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default ClubCoaches;
