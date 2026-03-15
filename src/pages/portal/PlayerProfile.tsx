import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  ExternalLink, Camera, Target, TrendingDown, Bell, BellOff, LogOut,
  Mail, Phone, MessageCircle, Calendar, Pencil, MapPin, Activity,
  Heart, Dumbbell, Trophy
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";
import UpcomingSchedule from "@/components/portal/UpcomingSchedule";
import PortalLayout from "@/components/portal/PortalLayout";
import PlayerProfileEdit from "@/components/portal/PlayerProfileEdit";

interface PlayerData {
  dominant_hand: string | null;
  years_playing: number;
  nationality: string | null;
  playtomic_url: string | null;
  playtomic_level: number | null;
  fitness_level: string | null;
  goals: string[];
  injuries: string | null;
  volley_pct: number;
  forehand_pct: number;
  serve_pct: number;
  smash_pct: number;
  backhand_pct: number;
  lob_pct: number;
  left_tendency_pct: number;
  right_tendency_pct: number;
  best_shot: string | null;
  weakest_shot: string | null;
  shot_data_source: string | null;
  date_of_birth: string | null;
  preferred_sport: string | null;
  favourite_players: string[];
  club_name: string | null;
  club_location: string | null;
  shirt_size: string | null;
  apple_health_connected: boolean;
  target_ranking: string | null;
  plays_since_year: number | null;
  preferred_court_surface: string | null;
  training_freq: string | null;
  current_usta_ntrp: number | null;
}

interface RacketData {
  id: string;
  brand: string;
  model: string;
  type: string;
  is_favorite: boolean;
  string_brand: string | null;
  string_tension: string | null;
  grip_size: string | null;
}

const SPORT_LABELS: Record<string, string> = { tennis: "🎾 Tennis", padel: "🏓 Padel", both: "🎾🏓 Both" };
const SURFACE_LABELS: Record<string, string> = { clay: "Clay", hard: "Hard Court", grass: "Grass", artificial_grass: "Artificial Grass", indoor: "Indoor" };
const FREQ_LABELS: Record<string, string> = { daily: "Daily", "3-4x_week": "3–4× / week", "1-2x_week": "1–2× / week", occasional: "Occasional" };

const PlayerProfile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [playerPhone, setPlayerPhone] = useState<string | null>(null);
  const [rackets, setRackets] = useState<RacketData[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    new_message: true,
    coach_feedback: true,
    new_plan: true,
    plan_reminder: true,
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: player }, { data: racketsData }, { data: prof }] = await Promise.all([
      supabase.from("player_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("player_rackets").select("*").eq("player_id", user.id),
      supabase.from("profiles").select("notification_preferences, phone").eq("user_id", user.id).single(),
    ]);
    if (player) setPlayerData(player as unknown as PlayerData);
    if (racketsData) setRackets(racketsData as unknown as RacketData[]);
    if (prof) {
      if (prof.phone) setPlayerPhone(prof.phone as string);
      if (prof.notification_preferences) {
        setNotifPrefs(prof.notification_preferences as typeof notifPrefs);
      }
    }
  };

  const toggleNotifPref = async (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    if (user) {
      await supabase.from("profiles").update({ notification_preferences: updated } as any).eq("user_id", user.id);
    }
  };

  const radarData = playerData
    ? [
        { shot: "Forehand", value: playerData.forehand_pct },
        { shot: "Backhand", value: playerData.backhand_pct },
        { shot: "Serve", value: playerData.serve_pct },
        { shot: "Volley", value: playerData.volley_pct },
        { shot: "Smash", value: playerData.smash_pct },
        { shot: "Lob", value: playerData.lob_pct },
      ]
    : [];

  const shots = playerData
    ? [
        { name: "Volley", pct: playerData.volley_pct },
        { name: "Forehand", pct: playerData.forehand_pct },
        { name: "Serve", pct: playerData.serve_pct },
        { name: "Smash", pct: playerData.smash_pct },
        { name: "Backhand", pct: playerData.backhand_pct },
        { name: "Lob", pct: playerData.lob_pct },
      ].sort((a, b) => b.pct - a.pct)
    : [];

  const favoriteRacket = rackets.find((r) => r.is_favorite);

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Identity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div />
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-display tracking-wider hover:bg-secondary/80 transition-colors"
            >
              <Pencil size={12} /> EDIT
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-3xl text-primary">
                    {profile?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5">
                <Camera size={12} className="text-primary-foreground" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl text-foreground">{profile?.full_name?.toUpperCase()}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {playerData?.nationality && (
                  <span className="font-body text-xs text-muted-foreground">{playerData.nationality}</span>
                )}
                {playerData?.dominant_hand && (
                  <span className="font-body text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-semibold">
                    {playerData.dominant_hand} hand
                  </span>
                )}
                {playerData?.preferred_sport && (
                  <span className="font-body text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded-full font-semibold">
                    {SPORT_LABELS[playerData.preferred_sport] || playerData.preferred_sport}
                  </span>
                )}
                {playerData?.years_playing !== undefined && playerData.years_playing > 0 && (
                  <span className="font-body text-xs text-muted-foreground">{playerData.years_playing}y playing</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact details */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {playerData?.date_of_birth && (
              <div className="flex items-center gap-2 text-sm font-body text-foreground">
                <Calendar size={14} className="text-muted-foreground shrink-0" />
                <span>
                  {(() => {
                    const dob = new Date(playerData.date_of_birth);
                    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                    return `${dob.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} (${age} years)`;
                  })()}
                </span>
              </div>
            )}
            {profile?.email && (
              <div className="flex items-center gap-2 text-sm font-body text-foreground">
                <Mail size={14} className="text-muted-foreground shrink-0" />
                <span>{profile.email}</span>
              </div>
            )}
            {playerPhone && (
              <div className="flex items-center gap-2 text-sm font-body text-foreground">
                <Phone size={14} className="text-muted-foreground shrink-0" />
                <span>{playerPhone}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/messages")}
            className="mt-4 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-widest hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} /> MESSAGE MY COACH
          </button>
        </motion.div>

        {/* Sport Preferences */}
        {playerData && (playerData.favourite_players?.length > 0 || playerData.preferred_court_surface || playerData.training_freq) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">SPORT PREFERENCES</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {playerData.preferred_court_surface && (
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="font-display text-sm text-foreground">{SURFACE_LABELS[playerData.preferred_court_surface] || playerData.preferred_court_surface}</p>
                  <p className="text-[10px] font-body text-muted-foreground uppercase">Court Surface</p>
                </div>
              )}
              {playerData.training_freq && (
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <Dumbbell size={18} className="text-primary mx-auto mb-1" />
                  <p className="font-display text-sm text-foreground">{FREQ_LABELS[playerData.training_freq] || playerData.training_freq}</p>
                  <p className="text-[10px] font-body text-muted-foreground uppercase">Training</p>
                </div>
              )}
              {playerData.target_ranking && (
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <Trophy size={18} className="text-chart-4 mx-auto mb-1" />
                  <p className="font-display text-sm text-foreground">{playerData.target_ranking}</p>
                  <p className="text-[10px] font-body text-muted-foreground uppercase">Target Ranking</p>
                </div>
              )}
            </div>
            {playerData.favourite_players?.length > 0 && (
              <div>
                <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-2">FAVOURITE PLAYERS</h3>
                <div className="flex flex-wrap gap-2">
                  {playerData.favourite_players.map((p) => (
                    <span key={p} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body font-medium">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* My Club */}
        {playerData?.club_name && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">MY CLUB</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-body text-sm font-medium text-foreground">{playerData.club_name}</p>
                {playerData.club_location && <p className="font-body text-xs text-muted-foreground">{playerData.club_location}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* Playtomic */}
        {(playerData?.playtomic_level || playerData?.playtomic_url) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">PLAYTOMIC</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {playerData?.playtomic_level && (
                  <span className="font-display text-4xl text-foreground">{playerData.playtomic_level}</span>
                )}
                {playerData?.current_usta_ntrp && (
                  <div className="text-center">
                    <span className="font-display text-2xl text-foreground">{playerData.current_usta_ntrp}</span>
                    <p className="text-[10px] font-body text-muted-foreground">NTRP</p>
                  </div>
                )}
              </div>
              {playerData?.playtomic_url && (
                <a href={playerData.playtomic_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary font-body text-sm hover:underline">
                  View profile <ExternalLink size={14} />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Play Style with Radar Chart */}
        {playerData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm tracking-wider text-muted-foreground">PLAY STYLE</h2>
              {playerData.shot_data_source === "coach" && (
                <span className="flex items-center gap-1 text-[10px] font-body font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  ★ Coach assessed
                </span>
              )}
            </div>

            {/* Radar Chart */}
            <div className="w-full aspect-square max-w-[280px] mx-auto mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="shot"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "Space Grotesk" }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Shots" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Side preference */}
            <div className="mb-6">
              <div className="h-10 rounded-full overflow-hidden flex mb-1">
                <div className="bg-primary flex items-center justify-start pl-3 transition-all" style={{ width: `${Math.max(playerData.left_tendency_pct, 15)}%` }}>
                  <span className="text-xs font-body font-semibold text-primary-foreground whitespace-nowrap">Left {playerData.left_tendency_pct}%</span>
                </div>
                <div className="bg-muted flex-1 flex items-center justify-end pr-3">
                  <span className="text-xs font-body font-semibold text-muted-foreground whitespace-nowrap">Right {playerData.right_tendency_pct}%</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-body text-center mt-1">Side Preference</p>
            </div>

            {/* Best/Weakest */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-secondary rounded-lg p-4 text-center">
                <Target size={24} className="text-primary mx-auto mb-2" />
                <p className="font-display text-lg text-foreground">{playerData.best_shot || "—"}</p>
                <p className="text-[10px] font-body text-muted-foreground uppercase">Best Shot</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <TrendingDown size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="font-display text-lg text-foreground">{playerData.weakest_shot || "—"}</p>
                <p className="text-[10px] font-body text-muted-foreground uppercase">Weakest Shot</p>
              </div>
            </div>

            {/* Shot bars */}
            <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3">SHOT CONFIDENCE</h3>
            <div className="space-y-3">
              {shots.map((shot, i) => (
                <div key={shot.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-body text-foreground">{shot.name}</span>
                    <span className="text-sm font-body font-semibold text-foreground">{shot.pct}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${i < 2 ? "bg-primary" : "bg-muted-foreground/30"}`} style={{ width: `${shot.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Rackets — enhanced */}
        {rackets.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm tracking-wider text-muted-foreground">MY RACKETS</h2>
              {favoriteRacket && <span className="text-xs font-body text-muted-foreground">Favorite: {favoriteRacket.brand}</span>}
            </div>
            <div className="space-y-3">
              {rackets.map((racket) => (
                <div key={racket.id} className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center font-display text-sm text-foreground">
                      {racket.brand.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm font-medium text-foreground">{racket.model}</span>
                        {racket.is_favorite && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body font-semibold uppercase">Main</span>
                        )}
                      </div>
                      <p className="text-xs font-body text-muted-foreground">{racket.brand} · {racket.type}</p>
                    </div>
                  </div>
                  {(racket.string_brand || racket.string_tension || racket.grip_size) && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                      {racket.string_brand && (
                        <span className="text-[10px] font-body text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          String: {racket.string_brand}
                        </span>
                      )}
                      {racket.string_tension && (
                        <span className="text-[10px] font-body text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          Tension: {racket.string_tension}
                        </span>
                      )}
                      {racket.grip_size && (
                        <span className="text-[10px] font-body text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          Grip: {racket.grip_size}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Connected Devices */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <HealthConnections />
          </motion.div>
        )}

        {/* Goals */}
        {playerData && playerData.goals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">GOALS & FITNESS</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {playerData.goals.map((goal) => (
                <span key={goal} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body font-medium">{goal}</span>
              ))}
            </div>
            {playerData.fitness_level && (
              <span className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-body font-semibold uppercase">{playerData.fitness_level}</span>
            )}
          </motion.div>
        )}

        {/* Upcoming Training */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <UpcomingSchedule playerId={user.id} linkPrefix="training" showCoach={true} />
          </motion.div>
        )}

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">NOTIFICATION SETTINGS</h2>
          <div className="space-y-3">
            {([
              { key: "new_message" as const, label: "New Messages", desc: "When you receive a new message" },
              { key: "coach_feedback" as const, label: "Coach Feedback", desc: "When your coach reviews a video" },
              { key: "new_plan" as const, label: "New Day Plan", desc: "When your coach creates a plan for you" },
              { key: "plan_reminder" as const, label: "Plan Reminder", desc: "Daily reminder if you have a plan" },
            ]).map((pref) => (
              <button
                key={pref.key}
                onClick={() => toggleNotifPref(pref.key)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="text-left">
                  <p className="font-body text-sm text-foreground">{pref.label}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{pref.desc}</p>
                </div>
                {notifPrefs[pref.key] ? <Bell size={18} className="text-primary shrink-0" /> : <BellOff size={18} className="text-muted-foreground shrink-0" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <button
            onClick={signOut}
            className="w-full py-3 rounded-xl border border-destructive/30 text-destructive font-display text-sm tracking-widest hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> SIGN OUT
          </button>
        </motion.div>

        {playerData && (
          <PlayerProfileEdit
            open={editOpen}
            onClose={() => setEditOpen(false)}
            playerData={playerData}
            phone={playerPhone}
            onSaved={fetchData}
          />
        )}
      </div>
    </PortalLayout>
  );
};

export default PlayerProfile;
