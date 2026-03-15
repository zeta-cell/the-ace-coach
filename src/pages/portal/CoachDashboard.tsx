import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Users, BookOpen, Calendar, ChevronRight, ShoppingBag, Mail, Check, X as XIcon } from "lucide-react";
import { format } from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import { toast } from "sonner";

interface AssignedPlayer {
  player_id: string;
  full_name: string;
  avatar_url: string | null;
  playtomic_level: number | null;
  fitness_level: string | null;
}

interface CoachRequest {
  id: string;
  player_id: string;
  player_name: string;
  block_title: string | null;
  message: string | null;
  request_type: string;
  created_at: string;
}

const CoachDashboard = () => {
  const { user, profile } = useAuth();
  const [players, setPlayers] = useState<AssignedPlayer[]>([]);
  const [moduleCount, setModuleCount] = useState(0);
  const [todayPlansCount, setTodayPlansCount] = useState(0);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch assigned players
    const { data: assignments } = await supabase
      .from("coach_player_assignments")
      .select("player_id")
      .eq("coach_id", user.id);

    const playerIds = assignments?.map((a) => a.player_id) || [];

    if (playerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", playerIds);

      const { data: playerProfiles } = await supabase
        .from("player_profiles")
        .select("user_id, playtomic_level, fitness_level")
        .in("user_id", playerIds);

      const ppMap = new Map(playerProfiles?.map((p) => [p.user_id, p]) || []);

      setPlayers(
        (profiles || []).map((p) => ({
          player_id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          playtomic_level: ppMap.get(p.user_id)?.playtomic_level ?? null,
          fitness_level: ppMap.get(p.user_id)?.fitness_level ?? null,
        }))
      );
    }

    // Module count
    const { count } = await supabase
      .from("modules")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id);
    setModuleCount(count || 0);

    // Today's plans
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const { count: plansCount } = await supabase
      .from("player_day_plans")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .eq("plan_date", todayStr);
    setTodayPlansCount(plansCount || 0);
  };

  const firstName = profile?.full_name?.split(" ")[0]?.toUpperCase() || "COACH";

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl md:text-4xl text-foreground mb-6"
        >
          WELCOME, {firstName}
        </motion.h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Link to="/coach/players" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
            <Users size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{players.length}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Players</p>
          </Link>
          <Link to="/coach/modules" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
            <BookOpen size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{moduleCount}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Modules</p>
          </Link>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Calendar size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{todayPlansCount}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Plans Today</p>
          </div>
        </div>

        {/* Recent players */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-foreground">YOUR PLAYERS</h2>
            <Link to="/coach/players" className="text-primary text-xs font-body hover:underline">View all</Link>
          </div>

          {players.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
              <Users size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground">No players assigned yet.</p>
              <p className="font-body text-xs text-muted-foreground mt-1">Ask your admin to assign players.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.slice(0, 5).map((player) => (
                <Link
                  key={player.player_id}
                  to={`/coach/players/${player.player_id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                    {player.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-foreground">{player.full_name}</p>
                    <p className="text-xs font-body text-muted-foreground">
                      {player.fitness_level || "—"} · Level {player.playtomic_level ?? "—"}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default CoachDashboard;
