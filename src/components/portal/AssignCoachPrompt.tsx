import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { assignSelfToCoach, claimPendingInvite, getPendingInvite, claimPendingCoach, getPendingCoach } from "@/lib/coachInvite";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";

interface CoachOption {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * Shown to players who signed up without an invite link (e.g. Google / Apple).
 * They must pick their coach so the coach can see and assess them.
 */
const AssignCoachPrompt = () => {
  const { user, role } = useAuth();
  const [needsCoach, setNeedsCoach] = useState(false);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || role !== "player") return;
    (async () => {
      // A pending invite link takes priority — claim it silently.
      if (getPendingInvite()) await claimPendingInvite();

      const { count } = await supabase
        .from("coach_player_assignments")
        .select("id", { count: "exact", head: true })
        .eq("player_id", user.id);
      if ((count ?? 0) > 0) return;

      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "coach");
      const ids = (roles || []).map((r) => r.user_id);
      if (ids.length === 0) return;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);
      setCoaches((profiles || []) as CoachOption[]);
      setNeedsCoach(true);
    })();
  }, [user, role]);

  const pick = async (coachId: string) => {
    setBusy(true);
    try {
      await assignSelfToCoach(coachId);
      toast.success("Coach connected — they can now assess you");
      setNeedsCoach(false);
    } catch (e: any) {
      toast.error(e.message || "Could not connect coach");
    }
    setBusy(false);
  };

  if (!needsCoach) return null;

  return (
    <div className="bg-card border border-primary/40 rounded-2xl p-5 mb-5">
      <div className="flex items-center gap-2 mb-1">
        <UserCheck size={18} className="text-primary" />
        <h2 className="font-display text-lg text-foreground tracking-wide">CONNECT YOUR COACH</h2>
      </div>
      <p className="font-body text-sm text-muted-foreground mb-4">
        Choose the coach you train with. They will be able to see your profile and publish your assessments.
      </p>
      <div className="space-y-2">
        {coaches.map((c) => (
          <button
            key={c.user_id}
            onClick={() => pick(c.user_id)}
            disabled={busy}
            className="w-full flex items-center gap-3 bg-background border border-border rounded-xl p-3 hover:border-primary/60 transition-colors disabled:opacity-50"
          >
            {c.avatar_url ? (
              <img src={c.avatar_url} alt={c.full_name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center font-display text-primary">
                {c.full_name?.charAt(0) || "C"}
              </div>
            )}
            <span className="font-body text-sm text-foreground">{c.full_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AssignCoachPrompt;
