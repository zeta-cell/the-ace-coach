import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicBottomNav from "@/components/PublicBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, MapPin, Flame, ArrowLeft } from "lucide-react";
import { LEVEL_CONFIG } from "@/lib/gamification";

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_level: string;
  total_sessions: number;
  current_streak_days: number;
  city: string | null;
  sport: string | null;
}

const Rankings = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<"global" | "city" | "tennis" | "padel">("global");
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    let query = supabase.from("leaderboard").select("*").order("total_xp", { ascending: false }).limit(100);

    if (filter === "tennis") query = query.eq("sport", "tennis");
    if (filter === "padel") query = query.eq("sport", "padel");

    const { data } = await query;
    const list = (data || []) as LeaderboardEntry[];
    setEntries(list);

    if (user) {
      const { data: myEntry } = await supabase
        .from('leaderboard')
        .select('rank_global, total_xp')
        .eq('user_id', user.id)
        .maybeSingle();
      setMyRank(myEntry?.rank_global || null);
    }
    setLoading(false);
  };

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = ["h-20", "h-28", "h-16"];
  const podiumColors = ["#C0C0C0", "#FFD700", "#CD7F32"];
  const podiumLabels = ["2ND", "1ST", "3RD"];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/find-a-coach" className="flex items-center gap-2 font-display text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> BACK
          </Link>
          <h1 className="font-display text-xl text-foreground">RANKINGS</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Podium */}
        {top3.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-end justify-center gap-3">
              {podiumOrder.map((entry, i) => {
                const lvl = LEVEL_CONFIG[entry.current_level] || LEVEL_CONFIG.bronze;
                return (
                  <div key={entry.user_id} className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden border-2 mb-2" style={{ borderColor: podiumColors[i] }}>
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-display text-lg text-primary">
                          {entry.display_name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <p className="font-display text-xs text-foreground truncate max-w-[80px]">{entry.display_name || "Player"}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{entry.total_xp} XP</p>
                    <div className={`${podiumHeights[i]} w-20 mt-2 rounded-t-lg flex items-start justify-center pt-2`} style={{ backgroundColor: podiumColors[i] + '30' }}>
                      <span className="font-display text-xs" style={{ color: podiumColors[i] }}>{podiumLabels[i]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(["global", "city", "tennis", "padel"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-display text-xs tracking-wider transition-colors whitespace-nowrap ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
              {f === "global" ? "GLOBAL" : f === "city" ? "BY CITY" : f.toUpperCase() + " ONLY"}
            </button>
          ))}
        </div>

        {/* Leaderboard table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-1.5">
            {rest.map((entry, i) => {
              const rank = i + 4;
              const isMe = user?.id === entry.user_id;
              const lvl = LEVEL_CONFIG[entry.current_level] || LEVEL_CONFIG.bronze;
              return (
                <motion.div key={entry.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isMe ? "bg-primary/10 border border-primary/30" : "bg-card border border-border"}`}>
                  <span className="font-display text-lg w-8 text-center text-muted-foreground">{rank}</span>
                  <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden shrink-0">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-sm text-primary">
                        {entry.display_name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-foreground truncate">{entry.display_name || "Player"}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-display" style={{ backgroundColor: lvl.color + '20', color: lvl.color }}>
                        {lvl.label.toUpperCase()}
                      </span>
                      {entry.city && (
                        <span className="text-[10px] font-body text-muted-foreground flex items-center gap-0.5">
                          <MapPin size={8} /> {entry.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-sm text-foreground">{entry.total_xp}</p>
                    <p className="font-body text-[9px] text-muted-foreground">XP</p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-display text-sm text-foreground">{entry.total_sessions}</p>
                    <p className="font-body text-[9px] text-muted-foreground">Sessions</p>
                  </div>
                  {entry.current_streak_days > 0 && (
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="font-display text-sm text-foreground flex items-center gap-1">
                        <Flame size={10} className="text-orange-400" /> {entry.current_streak_days}
                      </p>
                      <p className="font-body text-[9px] text-muted-foreground">Streak</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* My position sticky bar */}
        {myRank && (
          <div className="sticky bottom-4 mt-6">
            <div className="bg-card border border-primary/30 rounded-xl px-4 py-3 text-center">
              <p className="font-body text-sm text-foreground">
                You are ranked <span className="font-display text-primary">#{myRank}</span> globally
              </p>
            </div>
          </div>
        )}
      </div>
      <PublicBottomNav />
    </div>
  );
};

export default Rankings;
