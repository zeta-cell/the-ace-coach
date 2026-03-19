import { useState, useEffect } from "react";
import PublicHeader from "@/components/PublicHeader";
import { Link } from "react-router-dom";
import PublicBottomNav from "@/components/PublicBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Trophy, Medal, Crown, MapPin, Star, Award, Zap, Shield,
  ChevronRight, Calendar, Users, ShoppingBag, CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LEVEL_CONFIG } from "@/lib/gamification";

interface LeaderboardEntry {
  user_id: string; display_name: string | null; avatar_url: string | null;
  total_xp: number; current_level: string; total_sessions: number;
  current_streak_days: number; city: string | null;
}

interface BadgeEntry {
  id: string; user_id: string; badge_name: string; earned_at: string;
  player_name: string; player_avatar: string | null;
}

interface TrendingBlock {
  id: string; title: string; author_name: string | null;
  times_used: number; price: number; currency: string;
}

interface TopCoach {
  user_id: string; full_name: string; avatar_url: string | null;
  badge_level: string; is_verified: boolean; location_city: string | null;
  total_sessions_coached: number; profile_slug: string | null;
  avg_rating: number;
}

interface EventPreview {
  id: string; title: string; event_type: string; start_datetime: string;
  location_city: string | null; price_per_person: number; currency: string;
}

const BADGE_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  starter: { icon: Shield, color: "bg-muted text-muted-foreground", label: "Starter" },
  pro: { icon: Star, color: "bg-blue-500/20 text-blue-400", label: "Pro" },
  elite: { icon: Zap, color: "bg-amber-500/20 text-amber-400", label: "Elite" },
  legend: { icon: Crown, color: "bg-purple-500/20 text-purple-400", label: "Legend" },
};

const currencySymbol = (c: string) => ({ EUR: "€", USD: "$", GBP: "£" }[c] || c);

const Community = () => {
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<BadgeEntry[]>([]);
  const [trending, setTrending] = useState<TrendingBlock[]>([]);
  const [topCoaches, setTopCoaches] = useState<TopCoach[]>([]);
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLeaderboard(), fetchBadges(), fetchTrending(), fetchCoaches(), fetchEvents()])
      .then(() => setLoading(false));
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from("leaderboard").select("*").order("total_xp", { ascending: false }).limit(10);
    setTopPlayers((data || []) as LeaderboardEntry[]);
  };

  const fetchBadges = async () => {
    const { data } = await supabase.from("user_badges").select("*").order("earned_at", { ascending: false }).limit(20);
    if (data && data.length > 0) {
      const userIds = [...new Set((data as any[]).map((b: any) => b.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setBadges((data as any[]).map((b: any) => ({
        id: b.id, user_id: b.user_id, badge_name: b.badge_name, earned_at: b.earned_at,
        player_name: (profileMap.get(b.user_id) as any)?.full_name || "Player",
        player_avatar: (profileMap.get(b.user_id) as any)?.avatar_url || null,
      })));
    }
  };

  const fetchTrending = async () => {
    const { data } = await supabase.from("training_blocks").select("id, title, author_name, times_used, price, currency")
      .eq("is_public", true).order("times_used", { ascending: false }).limit(6);
    setTrending((data || []) as TrendingBlock[]);
  };

  const fetchCoaches = async () => {
    const { data: coaches } = await supabase.from("coach_profiles")
      .select("user_id, badge_level, is_verified, location_city, total_sessions_coached, profile_slug")
      .order("total_sessions_coached", { ascending: false }).limit(6);
    if (coaches && coaches.length > 0) {
      const ids = (coaches as any[]).map((c: any) => c.user_id);
      const [profilesRes, reviewsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids),
        supabase.from("reviews").select("coach_id, rating").in("coach_id", ids),
      ]);
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]));
      const ratingMap = new Map<string, number[]>();
      (reviewsRes.data || []).forEach((r: any) => {
        if (!ratingMap.has(r.coach_id)) ratingMap.set(r.coach_id, []);
        ratingMap.get(r.coach_id)!.push(r.rating);
      });
      setTopCoaches((coaches as any[]).map((c: any) => {
        const p = profileMap.get(c.user_id) as any;
        const ratings = ratingMap.get(c.user_id) || [];
        return {
          ...c,
          full_name: p?.full_name || "Coach",
          avatar_url: p?.avatar_url || null,
          avg_rating: ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0,
        };
      }));
    }
  };

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("id, title, event_type, start_datetime, location_city, price_per_person, currency")
      .in("status", ["published", "full"]).gte("start_datetime", new Date().toISOString())
      .order("start_datetime").limit(4);
    setEvents((data || []) as EventPreview[]);
  };

  const top3 = topPlayers.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = ["h-20", "h-28", "h-16"];
  const podiumColors = ["#C0C0C0", "#FFD700", "#CD7F32"];
  const podiumIcons = [Medal, Crown, Medal];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <PublicHeader />

      {/* Hero */}
      <div className="bg-card border-b border-border py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <h1 className="font-display text-3xl md:text-5xl text-foreground mb-3 relative">COMMUNITY</h1>
        <p className="font-body text-sm md:text-base text-muted-foreground max-w-2xl mx-auto relative">
          See who's leading, what's trending, and join the global tennis & padel community
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-12">
        {/* Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2"><Trophy size={16} className="text-primary" /> TOP PLAYERS</h2>
            <Link to="/rankings" className="font-display text-xs tracking-wider text-primary flex items-center gap-1">VIEW FULL RANKINGS <ChevronRight size={14} /></Link>
          </div>

          {/* Podium */}
          {top3.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {podiumOrder.map((p, i) => {
                const PodiumIcon = podiumIcons[i];
                const lvlCfg = LEVEL_CONFIG[p.current_level] || LEVEL_CONFIG.bronze;
                return (
                  <motion.div key={p.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center">
                    <div className="relative mb-2">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} className={`${i === 1 ? "w-20 h-20" : "w-14 h-14"} rounded-full object-cover border-2`} style={{ borderColor: podiumColors[i] }} alt="" />
                      ) : (
                        <div className={`${i === 1 ? "w-20 h-20" : "w-14 h-14"} rounded-full bg-primary/20 flex items-center justify-center border-2`} style={{ borderColor: podiumColors[i] }}>
                          <span className="font-display text-primary">{p.display_name?.charAt(0) || "?"}</span>
                        </div>
                      )}
                      <PodiumIcon size={16} className="absolute -top-1 -right-1" style={{ color: podiumColors[i] }} />
                    </div>
                    <p className="font-display text-xs text-foreground text-center truncate max-w-[80px]">{p.display_name || "Player"}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{p.total_xp} XP</p>
                    <div className={`${podiumHeights[i]} w-16 rounded-t-lg mt-2`} style={{ background: `${podiumColors[i]}33` }} />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Rest of leaderboard */}
          <div className="space-y-2">
            {topPlayers.slice(3, 10).map((p, i) => (
              <div key={p.user_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <span className="font-display text-sm text-muted-foreground w-6">{i + 4}</span>
                {p.avatar_url ? (
                  <img src={p.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-display text-primary">{p.display_name?.charAt(0)}</span>
                  </div>
                )}
                <span className="font-body text-sm text-foreground flex-1 truncate">{p.display_name}</span>
                <span className="font-display text-xs text-primary">{p.total_xp} XP</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Badges */}
        {badges.length > 0 && (
          <section>
            <h2 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2 mb-4"><Award size={16} className="text-primary" /> RECENT BADGES</h2>
            <div className="space-y-2">
              {badges.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                  {b.player_avatar ? (
                    <img src={b.player_avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-display text-primary">{b.player_name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-sm text-foreground">{b.player_name} </span>
                    <span className="font-body text-sm text-muted-foreground">earned </span>
                    <span className="font-display text-sm text-primary">{b.badge_name}</span>
                  </div>
                  <span className="font-body text-[10px] text-muted-foreground shrink-0">{formatDistanceToNow(new Date(b.earned_at), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Programs */}
        {trending.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2"><ShoppingBag size={16} className="text-primary" /> TRENDING PROGRAMS</h2>
              <Link to="/marketplace" className="font-display text-xs tracking-wider text-primary flex items-center gap-1">VIEW IN MARKETPLACE <ChevronRight size={14} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trending.map(t => (
                <Link to="/marketplace" key={t.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
                  <h3 className="font-display text-sm tracking-wider text-foreground mb-1 line-clamp-1">{t.title}</h3>
                  <p className="font-body text-xs text-muted-foreground mb-2">{t.author_name || "Coach"}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[10px] text-muted-foreground">{t.times_used} uses</span>
                    <span className={`font-display text-xs ${Number(t.price) === 0 ? "text-emerald-400" : "text-foreground"}`}>
                      {Number(t.price) === 0 ? "Free" : `${currencySymbol(t.currency || "EUR")}${t.price}`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2"><Calendar size={16} className="text-primary" /> UPCOMING EVENTS</h2>
              <Link to="/events" className="font-display text-xs tracking-wider text-primary flex items-center gap-1">VIEW ALL EVENTS <ChevronRight size={14} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {events.map(e => (
                <Link to="/events" key={e.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
                  <h3 className="font-display text-sm tracking-wider text-foreground mb-1">{e.title}</h3>
                  <p className="font-body text-xs text-muted-foreground">{new Date(e.start_datetime).toLocaleDateString()} · {e.location_city || "Online"}</p>
                  <span className={`font-display text-xs ${Number(e.price_per_person) === 0 ? "text-emerald-400" : "text-foreground"}`}>
                    {Number(e.price_per_person) === 0 ? "Free" : `${currencySymbol(e.currency)}${e.price_per_person}`}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top Coaches */}
        {topCoaches.length > 0 && (
          <section>
            <h2 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2 mb-4"><Users size={16} className="text-primary" /> TOP COACHES</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topCoaches.map(c => {
                const badge = BADGE_CONFIG[c.badge_level] || BADGE_CONFIG.starter;
                const BadgeIcon = badge.icon;
                return (
                  <Link to={c.profile_slug ? `/coach/${c.profile_slug}` : "/find-a-coach"} key={c.user_id}
                    className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-display text-primary">{c.full_name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm text-foreground truncate">{c.full_name}</span>
                          {c.is_verified && <CheckCircle size={12} className="text-blue-400 shrink-0" />}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-display tracking-wider ${badge.color}`}>
                          <BadgeIcon size={10} /> {badge.label.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-body text-muted-foreground">
                      <span>{c.location_city || "—"}</span>
                      <div className="flex items-center gap-1">
                        {c.avg_rating > 0 && <><Star size={10} className="text-amber-400 fill-amber-400" /><span>{c.avg_rating.toFixed(1)}</span></>}
                      </div>
                    </div>
                    <p className="font-display text-xs text-primary mt-1">VIEW PROFILE →</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <PublicBottomNav />
    </div>
  );
};

export default Community;
