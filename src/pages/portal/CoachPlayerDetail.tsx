import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, Target, TrendingDown, Calendar, CalendarDays, Plus, Mail, Phone, MessageCircle, ChevronDown, ChevronUp, User } from "lucide-react";
import UpcomingSchedule from "@/components/portal/UpcomingSchedule";
import { format, startOfWeek, addDays } from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";

const CoachPlayerDetail = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  const [rackets, setRackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (user && playerId) fetchAll();
  }, [user, playerId]);

  const fetchAll = async () => {
    if (!playerId) return;
    const [{ data: prof }, { data: pp }, { data: rk }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", playerId).single(),
      supabase.from("player_profiles").select("*").eq("user_id", playerId).single(),
      supabase.from("player_rackets").select("*").eq("player_id", playerId),
    ]);
    setProfileData(prof);
    setPlayerData(pp);
    setRackets(rk || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  const shots = playerData
    ? [
        { name: "Volley", pct: playerData.volley_pct ?? 50 },
        { name: "Forehand", pct: playerData.forehand_pct ?? 50 },
        { name: "Serve", pct: playerData.serve_pct ?? 50 },
        { name: "Smash", pct: playerData.smash_pct ?? 50 },
        { name: "Backhand", pct: playerData.backhand_pct ?? 50 },
        { name: "Lob", pct: playerData.lob_pct ?? 50 },
      ].sort((a, b) => b.pct - a.pct)
    : [];

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <Link to="/coach/players" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Players
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-2xl">
              {profileData?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl text-foreground">{profileData?.full_name}</h1>
              <p className="font-body text-sm text-muted-foreground">
                {playerData?.fitness_level || "—"} · Level {playerData?.playtomic_level ?? "—"} · {playerData?.dominant_hand || "—"} hand
              </p>
            </div>
            <Link
              to={`/training?player=${playerId}&date=${format(new Date(), "yyyy-MM-dd")}`}
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <CalendarDays size={18} />
            </Link>
          </div>

          {/* Contact Info — collapsible */}
          <div className="bg-card border border-border rounded-xl mb-6 overflow-hidden">
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground" />
                <h3 className="font-display text-sm tracking-wider text-muted-foreground">PLAYER INFO</h3>
              </div>
              {infoOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
            {infoOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm font-body text-foreground">
                  <Calendar size={14} className="text-muted-foreground shrink-0" />
                  <span>
                    {playerData?.date_of_birth
                      ? (() => {
                          const dob = new Date(playerData.date_of_birth);
                          const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                          return `${dob.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} (${age} years)`;
                        })()
                      : "No date of birth"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-body text-foreground">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  <span>{profileData?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-body text-foreground">
                  <Phone size={14} className="text-muted-foreground shrink-0" />
                  <span>{profileData?.phone || "No phone"}</span>
                </div>
                {playerData?.nationality && (
                  <div className="flex items-center gap-2 text-sm font-body text-foreground">
                    <span className="text-muted-foreground shrink-0 w-3.5 text-center">🌍</span>
                    <span>{playerData.nationality}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message button — always visible */}
          <button
            onClick={() => navigate(`/messages?to=${playerId}`)}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-widest hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mb-6"
          >
            <MessageCircle size={16} />
            MESSAGE PLAYER
          </button>

          {/* Best / Weakest */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <Target size={20} className="text-primary flex-shrink-0" />
              <div>
                <p className="font-display text-lg text-foreground">{playerData?.best_shot || "—"}</p>
                <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Best Shot</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <TrendingDown size={20} className="text-muted-foreground flex-shrink-0" />
              <div>
                <p className="font-display text-lg text-foreground">{playerData?.weakest_shot || "—"}</p>
                <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Weakest Shot</p>
              </div>
            </div>
          </div>

          {/* Shot bars */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">SHOT CONFIDENCE</h3>
            <div className="space-y-2">
              {shots.map((shot, idx) => (
                <div key={shot.name}>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-xs text-foreground">{shot.name}</span>
                    <span className="font-body text-xs text-muted-foreground">{shot.pct}%</span>
                  </div>
                   <div className="h-1.5 w-full rounded-full bg-[#222222]">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${shot.pct}%`, backgroundColor: idx < 2 ? '#e31e24' : '#444444' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side tendency */}
          {playerData && (
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">SIDE PREFERENCE</h3>
              <div className="flex h-8 rounded-full overflow-hidden">
                <div className="bg-primary flex items-center justify-center" style={{ width: `${playerData.left_tendency_pct}%` }}>
                  <span className="text-primary-foreground text-xs font-body font-medium px-2">L {playerData.left_tendency_pct}%</span>
                </div>
                <div className="bg-secondary flex items-center justify-center" style={{ width: `${playerData.right_tendency_pct}%` }}>
                  <span className="text-muted-foreground text-xs font-body font-medium px-2">R {playerData.right_tendency_pct}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Rackets */}
          {rackets.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">RACKETS</h3>
              <div className="space-y-2">
                {rackets.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-secondary rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-body text-sm text-foreground">{r.brand} {r.model}</p>
                      <p className="text-xs text-muted-foreground font-body">{r.type} {r.is_favorite ? "⭐" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming schedule */}
          {playerId && (
            <UpcomingSchedule playerId={playerId} linkPrefix="coach-plan" showCoach={false} daysAhead={21} />
          )}

          {/* Quick plan link */}
          <Link
            to={`/coach/plan/${playerId}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-widest hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} /> CREATE DAY PLAN
          </Link>
        </motion.div>
      </div>
    </PortalLayout>
  );
};

export default CoachPlayerDetail;
