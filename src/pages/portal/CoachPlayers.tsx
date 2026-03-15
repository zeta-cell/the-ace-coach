import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ChevronRight, Search, Users, BookOpen, Calendar, MessageSquare } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import QuickAddTrainingDrawer from "@/components/portal/QuickAddTrainingDrawer";

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

  useEffect(() => {
    if (user) fetchPlayers();
  }, [user]);

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
        <h1 className="font-display text-3xl text-foreground mb-4">PLAYERS</h1>

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
                initial={{ opacity: 0, y: 8 }}
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
                      title="Assign training"
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
      </div>
    </PortalLayout>
  );
};

export default CoachPlayers;
