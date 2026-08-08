import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ChevronRight, Search, Users, BookOpen, Calendar, MessageSquare, UserPlus, ClipboardCheck, Clock, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";
import QuickAddTrainingDrawer from "@/components/portal/QuickAddTrainingDrawer";
import InvitePlayerDrawer from "@/components/portal/InvitePlayerDrawer";
import CoachSignupLinkCard from "@/components/portal/CoachSignupLinkCard";

interface PendingInvite {
  id: string;
  full_name: string | null;
  email: string | null;
  token: string;
  created_at: string;
  has_assessment?: boolean;
}

interface PlayerRow {
  player_id: string;
  full_name: string;
  avatar_url: string | null;
  playtomic_level: number | null;
  fitness_level: string | null;
  best_shot: string | null;
  weakest_shot: string | null;
  program_name: string | null;
}

const CoachPlayers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [trainDrawerOpen, setTrainDrawerOpen] = useState(false);
  const [trainPlayerId, setTrainPlayerId] = useState<string | undefined>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlayers();
      fetchPending();
    }
  }, [user]);

  const fetchPending = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("coach_invites")
      .select("id, full_name, email, token, created_at")
      .eq("coach_id", user.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    const invites = (data || []) as PendingInvite[];
    if (invites.length) {
      const { data: assessed } = await supabase
        .from("player_assessments")
        .select("invite_id")
        .in("invite_id", invites.map((i) => i.id));
      const withAssessment = new Set((assessed || []).map((a: any) => a.invite_id));
      invites.forEach((i) => (i.has_assessment = withAssessment.has(i.id)));
    }
    setPending(invites);
  };

  const copyLink = async (invite: PendingInvite) => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${invite.token}`);
    setCopiedId(invite.id);
    toast.success("Invite link copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchPlayers = async () => {
    if (!user) return;
    const { data: assignments } = await supabase
      .from("coach_player_assignments")
      .select("player_id")
      .eq("coach_id", user.id);

    const ids = assignments?.map((a) => a.player_id) || [];
    if (ids.length === 0) { setLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", ids);

    const { data: pp } = await supabase
      .from("player_profiles")
      .select("user_id, playtomic_level, fitness_level, best_shot, weakest_shot")
      .in("user_id", ids);

    // Fetch program assignments via coach_requests
    const { data: requests } = await supabase
      .from("coach_requests").select("player_id, block_id, status")
      .eq("coach_id", user.id).eq("status", "accepted").not("block_id", "is", null);
    const blockIds = [...new Set(requests?.map((r) => r.block_id).filter(Boolean) || [])];
    const blockMap = new Map<string, string>();
    if (blockIds.length > 0) {
      const { data: blocks } = await supabase.from("training_blocks").select("id, title").in("id", blockIds);
      blocks?.forEach((b: any) => blockMap.set(b.id, b.title));
    }
    const playerProgramMap = new Map<string, string>();
    requests?.forEach((r) => { if (r.block_id && blockMap.has(r.block_id)) playerProgramMap.set(r.player_id, blockMap.get(r.block_id)!); });

    const ppMap = new Map(pp?.map((p) => [p.user_id, p]) || []);

    setPlayers(
      (profiles || []).map((p) => ({
        player_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        playtomic_level: ppMap.get(p.user_id)?.playtomic_level ?? null,
        fitness_level: ppMap.get(p.user_id)?.fitness_level ?? null,
        best_shot: ppMap.get(p.user_id)?.best_shot ?? null,
        weakest_shot: ppMap.get(p.user_id)?.weakest_shot ?? null,
        program_name: playerProgramMap.get(p.user_id) || null,
      }))
    );
    setLoading(false);
  };

  const filtered = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl sm:text-3xl text-foreground">PLAYERS</h1>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 bg-secondary text-foreground font-display text-[11px] sm:text-xs tracking-wider px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors whitespace-nowrap sm:flex-none"
            >
              <UserPlus size={15} /> INVITE
            </button>
            <Link
              to="/coach/players/new"
              className="inline-flex flex-1 items-center justify-center gap-1.5 bg-primary text-primary-foreground font-display text-[11px] sm:text-xs tracking-wider px-3 sm:px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap sm:flex-none"
            >
              <ClipboardCheck size={15} /> NEW PLAYER
            </Link>
          </div>
        </div>



        <CoachSignupLinkCard />



        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground mb-2">
              <Clock size={13} className="text-primary" /> PENDING INVITES ({pending.length})
            </h2>
            <div className="space-y-2">
              {pending.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm text-muted-foreground">
                    {inv.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm text-foreground">{inv.full_name || inv.email}</p>
                    <p className="font-body text-[11px] text-muted-foreground">
                      {inv.has_assessment ? "Assessment ready — waiting for sign-up" : "No assessment yet"}
                    </p>
                  </div>
                  <button
                    onClick={() => copyLink(inv)}
                    className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20"
                    title="Copy invite link"
                  >
                    {copiedId === inv.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-1/3" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
            <Users size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-sm text-muted-foreground mb-1">
              {players.length === 0 ? "No players assigned yet." : "No matching players."}
            </p>
            {players.length === 0 && (
              <p className="font-body text-xs text-muted-foreground">
                Ask your admin to assign players.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((player, i) => (
              <motion.div
                key={player.player_id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
                  <Link to={`/coach/players/${player.player_id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-lg flex-shrink-0">
                      {player.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg text-foreground truncate">{player.full_name}</p>
                      <div className="flex gap-3 text-xs font-body text-muted-foreground">
                        <span>{player.fitness_level || "—"}</span>
                        <span>Level {player.playtomic_level ?? "—"}</span>
                        {player.best_shot && <span className="text-primary">Best: {player.best_shot}</span>}
                      </div>
                      {player.program_name && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <BookOpen size={10} className="text-primary" />
                          <span className="text-[9px] font-body text-primary">Via: {player.program_name}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setTrainPlayerId(player.player_id); setTrainDrawerOpen(true); }}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Create training"
                    >
                      <Calendar size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/coach/messages?to=${player.player_id}`); }}
                      className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Message"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                  <Link to={`/coach/players/${player.player_id}`}>
                    <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <QuickAddTrainingDrawer
          open={trainDrawerOpen}
          onClose={() => { setTrainDrawerOpen(false); setTrainPlayerId(undefined); }}
          prefilledPlayerId={trainPlayerId}
        />
        <InvitePlayerDrawer open={inviteOpen} onClose={() => { setInviteOpen(false); fetchPlayers(); fetchPending(); }} />
      </div>
    </PortalLayout>
  );
};

export default CoachPlayers;
