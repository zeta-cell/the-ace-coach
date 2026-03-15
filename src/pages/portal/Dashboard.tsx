import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Play, Calendar, TrendingUp, Flame, CheckCircle, ShoppingBag,
  ChevronRight, MessageCircle, UserPlus, User as UserIcon, X,
  Zap, Wallet, Trophy, Lock, Award, Star
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, subWeeks } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Line, ComposedChart } from "recharts";
import PortalLayout from "@/components/portal/PortalLayout";
import TrainingDayInfo from "@/components/portal/TrainingDayInfo";
import UpcomingBookings from "@/components/portal/UpcomingBookings";
import WalletCard from "@/components/portal/WalletCard";
import RaffleCard from "@/components/portal/RaffleCard";
import { Progress } from "@/components/ui/progress";
import { LEVEL_CONFIG, BADGE_DEFINITIONS, getNextLevel } from "@/lib/gamification";
import { toast } from "sonner";

interface DayPlan {
  id: string; plan_date: string; notes: string | null;
  items: { id: string; module_title: string; duration_minutes: number; is_completed: boolean; category: string; }[];
}

interface PurchasedProgram {
  id: string; block_id: string; current_week: number;
  title: string; author_name: string | null; author_avatar_url: string | null;
  week_count: number; block_type: string; thumbnail_url: string | null;
  coach_status: "none" | "pending" | "accepted";
  coach_name: string | null; coach_id: string | null; request_id: string | null;
}

interface UserStats {
  total_xp: number;
  current_level: string;
  current_streak_days: number;
  total_sessions: number;
  wallet_balance: number;
  raffle_tickets: number;
}

interface EarnedBadge {
  badge_key: string;
  badge_name: string;
  earned_at: string;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [value]);
  return <>{display}</>;
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [weekPlans, setWeekPlans] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [programs, setPrograms] = useState<PurchasedProgram[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ total_xp: 0, current_level: 'bronze', current_streak_days: 0, total_sessions: 0, wallet_balance: 0, raffle_tickets: 0 });
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchPrograms();
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    if (!user) return;

    // User stats (upsert to ensure row exists)
    await supabase.from("user_stats").upsert(
      { user_id: user.id, total_xp: 0, current_level: 'bronze' },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
    const { data: stats } = await supabase.from("user_stats").select("*").eq("user_id", user.id).single();
    if (stats) setUserStats(stats as UserStats);

    // Earned badges
    const { data: badges } = await supabase.from("user_badges").select("badge_key, badge_name, earned_at").eq("user_id", user.id).order("earned_at", { ascending: false });
    setEarnedBadges((badges || []) as EarnedBadge[]);

    // Activity chart (last 8 weeks)
    const weeks: any[] = [];
    for (let i = 7; i >= 0; i--) {
      const wStart = subWeeks(weekStart, i);
      const wEnd = addDays(wStart, 6);
      weeks.push({ weekStart: wStart, weekEnd: wEnd, label: format(wStart, "d MMM") });
    }
    const eightWeeksAgo = format(subWeeks(weekStart, 7), "yyyy-MM-dd");
    const { data: plans } = await supabase.from("player_day_plans").select("plan_date").eq("player_id", user.id).gte("plan_date", eightWeeksAgo);
    const { data: xpEvents } = await supabase.from("user_xp_events").select("xp_amount, created_at").eq("user_id", user.id).gte("created_at", subWeeks(weekStart, 7).toISOString());

    const chartData = weeks.map(w => {
      const sessions = (plans || []).filter(p => {
        const d = new Date(p.plan_date);
        return d >= w.weekStart && d <= w.weekEnd;
      }).length;
      const xp = (xpEvents || []).filter(e => {
        const d = new Date(e.created_at);
        return d >= w.weekStart && d <= w.weekEnd;
      }).reduce((sum, e) => sum + e.xp_amount, 0);
      return { name: w.label, sessions, xp };
    });
    setActivityData(chartData);

    // Top 3 leaderboard
    const { data: top } = await supabase.from("leaderboard").select("*").order("total_xp", { ascending: false }).limit(3);
    setTopPlayers(top || []);

    const { data: allRanks } = await supabase.from("leaderboard").select("user_id, total_xp").order("total_xp", { ascending: false });
    if (allRanks) {
      const idx = allRanks.findIndex(r => r.user_id === user.id);
      setMyRank(idx >= 0 ? idx + 1 : null);
    }

    // Check and award badges
    checkBadges(stats as UserStats | null, (badges || []) as EarnedBadge[]);
  };

  const checkBadges = async (stats: any, existingBadges: any[]) => {
    if (!user || !stats) return;
    const earned = new Set((existingBadges || []).map((b: any) => b.badge_key));
    const newBadges: { key: string; name: string; desc: string }[] = [];

    if (stats.total_sessions >= 1 && !earned.has('first_session')) newBadges.push({ key: 'first_session', name: 'First Session', desc: 'Complete your first booked session' });
    if (stats.current_streak_days >= 7 && !earned.has('streak_7')) newBadges.push({ key: 'streak_7', name: '7-Day Warrior', desc: 'Train 7 days in a row' });
    if (stats.current_streak_days >= 30 && !earned.has('streak_30')) newBadges.push({ key: 'streak_30', name: '30-Day Legend', desc: 'Train 30 days in a row' });
    if (stats.total_sessions >= 10 && !earned.has('sessions_10')) newBadges.push({ key: 'sessions_10', name: 'Dedicated', desc: 'Complete 10 sessions total' });
    if (stats.total_sessions >= 50 && !earned.has('sessions_50')) newBadges.push({ key: 'sessions_50', name: 'Elite Trainer', desc: 'Complete 50 sessions total' });

    for (const badge of newBadges) {
      await supabase.from("user_badges").insert({
        user_id: user.id,
        badge_key: badge.key,
        badge_name: badge.name,
        badge_description: badge.desc,
      });
      await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_amount: 30,
        p_event_type: 'badge_earned',
        p_description: `Badge: ${badge.name}`,
      });
      toast.success(`🏆 New badge earned: ${badge.name}!`);
    }
  };

  const fetchPrograms = async () => {
    if (!user) return;
    const { data: purchases } = await supabase.from("block_purchases").select("id, block_id, current_week").eq("buyer_id", user.id).eq("status", "completed");
    if (!purchases || purchases.length === 0) return;
    const blockIds = purchases.map((p) => p.block_id);
    const { data: blocks } = await supabase.from("training_blocks").select("id, title, author_name, author_avatar_url, week_count, block_type, thumbnail_url").in("id", blockIds);
    const blockMap = new Map((blocks as any[])?.map((b) => [b.id, b]) || []);
    const { data: requests } = await supabase.from("coach_requests").select("id, block_id, coach_id, status").eq("player_id", user.id).in("block_id", blockIds);
    const requestMap = new Map<string, { status: string; coach_id: string; request_id: string }>();
    requests?.forEach((r) => { if (r.block_id) requestMap.set(r.block_id, { status: r.status || "pending", coach_id: r.coach_id, request_id: r.id }); });
    const coachIds = [...new Set(requests?.map((r) => r.coach_id) || [])];
    const coachNameMap = new Map<string, string>();
    if (coachIds.length > 0) {
      const { data: coachProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", coachIds);
      coachProfiles?.forEach((p) => coachNameMap.set(p.user_id, p.full_name));
    }
    setPrograms(purchases.map((p) => {
      const b = blockMap.get(p.block_id);
      const req = requestMap.get(p.block_id);
      return {
        ...p, title: b?.title || "Program", author_name: b?.author_name, author_avatar_url: b?.author_avatar_url,
        week_count: b?.week_count || 1, block_type: b?.block_type || "session", thumbnail_url: b?.thumbnail_url,
        coach_status: req ? (req.status === "accepted" ? "accepted" : "pending") as any : "none",
        coach_name: req ? coachNameMap.get(req.coach_id) || null : null,
        coach_id: req?.coach_id || null, request_id: req?.request_id || null,
      };
    }));
  };

  const cancelRequest = async (requestId: string) => {
    await supabase.from("coach_requests").update({ status: "cancelled" } as any).eq("id", requestId);
    toast.success("Request cancelled");
    fetchPrograms();
  };

  const fetchPlans = async () => {
    if (!user) return;
    const todayStr = format(today, "yyyy-MM-dd");
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const { data: todayData } = await supabase.from("player_day_plans").select("id, plan_date, notes").eq("player_id", user.id).eq("plan_date", todayStr).maybeSingle();
    if (todayData) {
      const { data: items } = await supabase.from("player_day_plan_items").select("id, is_completed, coach_note, order_index, module_id").eq("plan_id", todayData.id).order("order_index");
      const moduleIds = items?.map((i) => i.module_id) || [];
      const { data: modules } = await supabase.from("modules").select("id, title, duration_minutes, category").in("id", moduleIds.length > 0 ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);
      const moduleMap = new Map(modules?.map((m) => [m.id, m]) || []);
      setTodayPlan({ ...todayData, items: (items || []).map((item) => { const mod = moduleMap.get(item.module_id); return { id: item.id, module_title: mod?.title || "Unknown", duration_minutes: mod?.duration_minutes || 0, is_completed: item.is_completed, category: mod?.category || "" }; }) });
    }
    const { data: weekData } = await supabase.from("player_day_plans").select("plan_date").eq("player_id", user.id).gte("plan_date", weekStartStr).lte("plan_date", weekEndStr);
    setWeekPlans(weekData?.map((d) => d.plan_date) || []);
  };

  const totalDuration = todayPlan?.items.reduce((sum, i) => sum + i.duration_minutes, 0) || 0;
  const firstName = profile?.full_name?.split(" ")[0]?.toUpperCase() || "PLAYER";

  const lvl = LEVEL_CONFIG[userStats.current_level] || LEVEL_CONFIG.bronze;
  const nextLevel = getNextLevel(userStats.current_level);
  const nextLvl = nextLevel ? LEVEL_CONFIG[nextLevel] : null;
  const xpProgress = nextLvl ? ((userStats.total_xp - lvl.xpMin) / (nextLvl.xpMin - lvl.xpMin)) * 100 : 100;
  const xpToNext = nextLvl ? nextLvl.xpMin - userStats.total_xp : 0;

  const isGoldPlus = ['gold', 'platinum', 'diamond', 'legend'].includes(userStats.current_level);

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl md:text-4xl text-foreground mb-6">
          WELCOME BACK, {firstName}
        </motion.h1>

        {/* SECTION A — Hero Stats Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Zap size={18} className="mx-auto mb-1" style={{ color: lvl.color }} />
            <p className="font-display text-2xl text-foreground"><AnimatedNumber value={userStats.total_xp} /></p>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lvl.color }} />
              <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">{lvl.label}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Flame size={18} className="text-orange-400 mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground"><AnimatedNumber value={userStats.current_streak_days} /></p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Day Streak</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <CheckCircle size={18} className="text-green-400 mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground"><AnimatedNumber value={userStats.total_sessions} /></p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Sessions</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Wallet size={18} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">€<AnimatedNumber value={Math.round(Number(userStats.wallet_balance))} /></p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Wallet</p>
          </div>
        </motion.div>

        {/* SECTION B — Level Progress */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: lvl.color + '20' }}>
              <Trophy size={18} style={{ color: lvl.color }} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm text-foreground">{lvl.label.toUpperCase()} LEVEL</h3>
              <p className="font-body text-xs text-muted-foreground">
                {nextLvl ? `${xpToNext} XP to ${nextLvl.label}` : "Max level reached! 🏆"}
              </p>
            </div>
            <Link to="/rewards" className="text-xs font-display text-primary tracking-wider hover:underline">REWARDS →</Link>
          </div>
          <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.5 }}>
            <Progress value={Math.min(xpProgress, 100)} className="h-3" />
          </motion.div>
        </motion.div>

        {/* SECTION C — Activity Chart */}
        {activityData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" /> TRAINING ACTIVITY
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                  <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Sessions" />
                  <Line type="monotone" dataKey="xp" stroke="#FFD700" strokeWidth={2} dot={false} name="XP" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* SECTION D — Recent Badges */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
              <Award size={14} className="text-primary" /> BADGES
            </h3>
          </div>
          {earnedBadges.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-4 text-center">
              <p className="font-body text-xs text-muted-foreground">Complete sessions to earn your first badge! 🏅</p>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {earnedBadges.slice(0, 8).map(b => {
                const def = BADGE_DEFINITIONS.find(d => d.key === b.badge_key);
                return (
                  <div key={b.badge_key} className="shrink-0 w-20 bg-card border border-border rounded-xl p-3 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-1">
                      <Star size={16} className="text-primary" />
                    </div>
                    <p className="font-display text-[9px] text-foreground truncate">{b.badge_name}</p>
                    <p className="font-body text-[8px] text-muted-foreground">{format(new Date(b.earned_at), "d MMM")}</p>
                  </div>
                );
              })}
            </div>
          )}
          {/* All badges grid */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3">
            {BADGE_DEFINITIONS.map(def => {
              const earned = earnedBadges.find(b => b.badge_key === def.key);
              return (
                <div key={def.key} className={`text-center p-2 rounded-lg ${earned ? "bg-card border border-border" : "bg-muted/20 opacity-40"}`}>
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-0.5 ${earned ? "bg-primary/10" : "bg-muted"}`}>
                    {earned ? <Star size={12} className="text-primary" /> : <Lock size={10} className="text-muted-foreground" />}
                  </div>
                  <p className="font-body text-[7px] text-muted-foreground truncate">{def.name}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* SECTION E — Leaderboard Preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
              <Trophy size={14} className="text-primary" /> LEADERBOARD
            </h3>
            <Link to="/rankings" className="text-xs font-display text-primary tracking-wider hover:underline">VIEW ALL →</Link>
          </div>
          {myRank && <p className="font-body text-xs text-muted-foreground mb-3">Your rank: <span className="text-primary font-display">#{myRank}</span></p>}
          <div className="space-y-2">
            {topPlayers.map((p, i) => {
              const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
              return (
                <div key={p.user_id} className="flex items-center gap-3">
                  <span className="font-display text-lg w-6 text-center" style={{ color: colors[i] }}>{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden shrink-0">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center font-display text-sm text-primary">{p.display_name?.charAt(0) || "?"}</div>}
                  </div>
                  <span className="font-body text-sm text-foreground flex-1 truncate">{p.display_name || "Player"}</span>
                  <span className="font-display text-sm text-foreground">{p.total_xp} XP</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Wallet & Referrals */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mb-6">
          <WalletCard />
        </motion.div>

        {/* Raffle (Gold+ only) */}
        {isGoldPlus && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <RaffleCard />
          </motion.div>
        )}

        {/* Today's plan card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="flex">
            <div className="w-1 bg-primary" />
            <div className="flex-1 p-5">
              {todayPlan && todayPlan.items.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-xl text-foreground">TODAY'S TRAINING</h2>
                    <span className="font-body text-xs text-muted-foreground">{todayPlan.items.length} modules · {totalDuration} min</span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mb-4">{todayPlan.items[0]?.module_title}{todayPlan.items.length > 1 && ` + ${todayPlan.items.length - 1} more`}</p>
                  <Link to="/training" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display text-sm tracking-wider px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
                    <Play size={16} /> START TRAINING
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl text-foreground mb-2">NO TRAINING TODAY</h2>
                  <p className="font-body text-sm text-muted-foreground">Rest day or your coach hasn't assigned a plan yet. 💪</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Upcoming booked sessions */}
        <UpcomingBookings />

        {/* My Programs */}
        {programs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6" id="programs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm tracking-wider text-foreground flex items-center gap-2"><ShoppingBag size={16} className="text-primary" /> MY PROGRAMS</h3>
              <Link to="/marketplace" className="text-xs font-body text-primary hover:underline">Browse more</Link>
            </div>
            <div className="space-y-2">
              {programs.map((prog) => {
                const progress = prog.week_count > 1 ? Math.round(((prog.current_week || 1) / prog.week_count) * 100) : 0;
                const status = (prog.current_week || 1) <= 1 ? "NOT STARTED" : (prog.current_week || 1) >= prog.week_count ? "COMPLETED" : "IN PROGRESS";
                return (
                  <div key={prog.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <ShoppingBag size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-foreground truncate">{prog.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-body text-muted-foreground">by {prog.author_name || "ACE"}</span>
                          {prog.week_count > 1 && <span className="text-[9px] font-body text-primary">Week {prog.current_week || 1} of {prog.week_count}</span>}
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-display ${status === "COMPLETED" ? "bg-green-500/20 text-green-400" : status === "IN PROGRESS" ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>{status}</span>
                        </div>
                        {prog.week_count > 1 && (
                          <div className="w-full h-1 bg-muted rounded-full mt-1.5">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                      <Link to="/training" className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      {prog.coach_status === "accepted" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle size={12} className="text-green-400" /></div>
                          <span className="text-xs font-body text-foreground">Coached by {prog.coach_name}</span>
                          <button onClick={() => navigate(`/messages?to=${prog.coach_id}`)} className="ml-auto px-3 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground font-display text-[9px] tracking-wider flex items-center gap-1">
                            <MessageCircle size={10} /> MESSAGE
                          </button>
                        </div>
                      ) : prog.coach_status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center"><UserIcon size={12} className="text-amber-400" /></div>
                          <span className="text-xs font-body text-muted-foreground">Request pending with {prog.coach_name}</span>
                          <button onClick={() => prog.request_id && cancelRequest(prog.request_id)} className="ml-auto px-3 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground font-display text-[9px] tracking-wider flex items-center gap-1">
                            <X size={10} /> CANCEL
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><UserIcon size={12} className="text-muted-foreground" /></div>
                          <span className="text-xs font-body text-muted-foreground">Doing this alone</span>
                          <Link to="/marketplace" className="ml-auto text-[9px] font-display text-primary hover:underline flex items-center gap-1">
                            <UserPlus size={10} /> FIND A COACH →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Training Day Info */}
        {user && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="mb-6"><TrainingDayInfo playerId={user.id} date={format(today, "yyyy-MM-dd")} /></motion.div>}

        {/* Week strip */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
          <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">THIS WEEK</h3>
          <div className="flex gap-2">
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd"); const hasPlan = weekPlans.includes(dayStr);
              const isToday = isSameDay(day, today); const isSelected = isSameDay(day, selectedDay);
              return (
                <button key={dayStr} onClick={() => setSelectedDay(day)}
                  className={`flex-1 py-2 rounded-lg text-center relative transition-colors ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-secondary text-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
                  <span className="font-display text-xs block">{format(day, "EEE")}</span>
                  <span className="font-body text-xs">{format(day, "d")}</span>
                  {hasPlan && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;
