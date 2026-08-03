import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { UserPlus, Trash2, Crown, Shield, User, Link2 } from "lucide-react";
import type { AcademyCoach } from "@/hooks/useAcademy";

const roleIcon = (r: string) => (r === "owner" ? Crown : r === "manager" ? Shield : User);

interface Props {
  clubId: string;
  coaches: AcademyCoach[];
  ownerId: string;
  onChanged: () => void;
}

const AcademyRoster = ({ clubId, coaches, ownerId, onChanged }: Props) => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"coach" | "manager">("coach");
  const [linkEmail, setLinkEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const invite = async () => {
    if (!inviteEmail || !user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("club_invites")
      .insert({
        club_id: clubId,
        email: inviteEmail.toLowerCase().trim(),
        invited_by: user.id,
        club_role: inviteRole,
      })
      .select("token")
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const link = `${window.location.origin}/club-invite/${data.token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Invite created — link copied");
    setInviteEmail("");
    onChanged();
  };

  const linkExisting = async () => {
    if (!linkEmail) return;
    setBusy(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", linkEmail.toLowerCase().trim())
      .maybeSingle();
    if (!profile) {
      setBusy(false);
      toast.error("No account found with that email");
      return;
    }
    const { error } = await supabase
      .from("club_coaches")
      .insert({ club_id: clubId, coach_id: profile.user_id, club_role: "coach" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Coach added to your academy");
    setLinkEmail("");
    onChanged();
  };

  const changeRole = async (id: string, club_role: string) => {
    const { error } = await supabase.from("club_coaches").update({ club_role }).eq("id", id);
    if (error) toast.error(error.message);
    else onChanged();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this coach from your academy?")) return;
    const { error } = await supabase.from("club_coaches").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      onChanged();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-display text-xs tracking-wider text-foreground">INVITE A NEW COACH</h3>
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="coach@email.com"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            {(["coach", "manager"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setInviteRole(r)}
                className={`flex-1 py-2 rounded-md font-display text-[10px] tracking-wider ${
                  inviteRole === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={invite}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[11px] tracking-wider disabled:opacity-60"
          >
            <UserPlus size={14} /> CREATE INVITE LINK
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-display text-xs tracking-wider text-foreground">ADD EXISTING COACH</h3>
          <input
            value={linkEmail}
            onChange={(e) => setLinkEmail(e.target.value)}
            placeholder="Email of an existing account"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <button
            onClick={linkExisting}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-foreground font-display text-[11px] tracking-wider disabled:opacity-60"
          >
            <Link2 size={14} /> ADD TO ACADEMY
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {coaches.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm">No coaches in your academy yet.</p>
        ) : (
          coaches.map((c) => {
            const Icon = roleIcon(c.club_role);
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={c.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon size={16} className="text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm tracking-wider text-foreground truncate">{c.full_name}</p>
                    <p className="font-body text-xs text-muted-foreground truncate">{c.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-display text-[10px] tracking-wider px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                    {c.club_role.toUpperCase()}
                  </span>
                  {c.coach_id !== ownerId && (
                    <>
                      <button
                        onClick={() => changeRole(c.id, c.club_role === "manager" ? "coach" : "manager")}
                        className="font-display text-[10px] tracking-wider text-muted-foreground hover:text-primary"
                      >
                        {c.club_role === "manager" ? "MAKE COACH" : "MAKE MANAGER"}
                      </button>
                      <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AcademyRoster;
