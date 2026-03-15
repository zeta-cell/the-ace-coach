import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Users, BookOpen, Video, CreditCard, TrendingUp, Activity, Database, Loader2,
  DollarSign, BarChart3, UserCheck, ShieldCheck, ArrowRight, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ComposedChart
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";

const AnimatedNumber = ({ value, prefix = "" }: { value: number; prefix?: string }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const dur = 800; const start = Date.now();
    const animate = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setDisplay(Math.round(value * p));
      if (p < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [value]);
  return <>{prefix}{display}</>;
};

interface PlatformStats {
  totalGMV: number; mrr: number; platformRevenue: number;
  totalUsers: number; activeCoaches: number; activePlayers: number;
  avgBookingValue: number; coachRetention: number; playerRetention: number; referralConversion: number;
}

interface BookingFeed {
  id: string; player_name: string; coach_name: string; amount: number; status: string; created_at: string;
}

interface UnverifiedCoach {
  user_id: string; full_name: string; location_city: string | null; packages_count: number; created_at: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({ totalGMV: 0, mrr: 0, platformRevenue: 0, totalUsers: 0, activeCoaches: 0, activePlayers: 0, avgBookingValue: 0, coachRetention: 0, playerRetention: 0, referralConversion: 0 });
  const [gmvData, setGmvData] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [topCoaches, setTopCoaches] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<BookingFeed[]>([]);
  const [unverifiedCoaches, setUnverifiedCoaches] = useState<UnverifiedCoach[]>([]);
  const [eventStats, setEventStats] = useState({ total: 0, thisMonth: 0, totalRegs: 0, revenue: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [skippedCoaches, setSkippedCoaches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("admin_skipped_coaches") || "[]"); } catch { return []; }
  });

  useEffect(() => { if (user) fetchAll(); }, [user]);

  // Auto-refresh activity feed
  useEffect(() => {
    const interval = setInterval(() => { if (user) fetchActivityFeed(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    await Promise.all([fetchStats(), fetchCharts(), fetchTopPerformers(), fetchActivityFeed(), fetchUnverified(), fetchEventStats()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const now = new Date();
    const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const thirtyDaysAgo = format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd");

    const [bookingsRes, profilesRes, coachesRes, playersRes, recentCoachRes, recentPlayerRes, referralsRes] = await Promise.all([
      supabase.from("bookings").select("total_price, platform_fee, booking_date, status"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("coach_profiles").select("user_id", { count: "exact", head: true }),
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "player"),
      supabase.from("bookings").select("coach_id").gte("booking_date", thirtyDaysAgo).eq("status", "confirmed"),
      supabase.from("bookings").select("player_id").gte("booking_date", thirtyDaysAgo).eq("status", "confirmed"),
      supabase.from("referrals").select("status"),
    ]);

    const allBookings = bookingsRes.data || [];
    const confirmedBookings = allBookings.filter(b => b.status === "confirmed" || b.status === "completed");
    const totalGMV = confirmedBookings.reduce((s, b) => s + Number(b.total_price), 0);
    const platformRevenue = confirmedBookings.reduce((s, b) => s + Number(b.platform_fee), 0);
    const thisMonthBookings = confirmedBookings.filter(b => b.booking_date >= thisMonthStart);
    const mrr = thisMonthBookings.reduce((s, b) => s + Number(b.total_price), 0);

    const uniqueRecentCoaches = new Set((recentCoachRes.data || []).map(b => b.coach_id));
    const uniqueRecentPlayers = new Set((recentPlayerRes.data || []).map(b => b.player_id));
    const allReferrals = referralsRes.data || [];
    const completedReferrals = allReferrals.filter(r => r.status === "completed").length;

    setStats({
      totalGMV, mrr, platformRevenue,
      totalUsers: profilesRes.count || 0,
      activeCoaches: coachesRes.count || 0,
      activePlayers: playersRes.count || 0,
      avgBookingValue: confirmedBookings.length > 0 ? totalGMV / confirmedBookings.length : 0,
      coachRetention: (coachesRes.count || 0) > 0 ? Math.round((uniqueRecentCoaches.size / (coachesRes.count || 1)) * 100) : 0,
      playerRetention: (playersRes.count || 0) > 0 ? Math.round((uniqueRecentPlayers.size / (playersRes.count || 1)) * 100) : 0,
      referralConversion: allReferrals.length > 0 ? Math.round((completedReferrals / allReferrals.length) * 100) : 0,
    });
  };

  const fetchCharts = async () => {
    const now = new Date();
    const months: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = subMonths(now, i);
      months.push({ label: format(m, "MMM"), start: format(startOfMonth(m), "yyyy-MM-dd"), end: format(endOfMonth(m), "yyyy-MM-dd"), monthKey: format(m, "yyyy-MM") });
    }

    const [bookingsRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from("bookings").select("total_price, platform_fee, coach_payout, booking_date, status").gte("booking_date", months[0].start).in("status", ["confirmed", "completed"]),
      supabase.from("profiles").select("created_at").gte("created_at", months[0].start + "T00:00:00Z"),
      supabase.from("user_roles").select("role, user_id").in("role", ["player", "coach"]),
    ]);

    const bookings = bookingsRes.data || [];
    setGmvData(months.map(m => {
      const mb = bookings.filter(b => b.booking_date >= m.start && b.booking_date <= m.end);
      return { name: m.label, platform: mb.reduce((s, b) => s + Number(b.platform_fee), 0), coach: mb.reduce((s, b) => s + Number(b.coach_payout), 0) };
    }));

    // User growth — cumulative
    const profiles = profilesRes.data || [];
    let cumPlayers = 0, cumCoaches = 0;
    const playerSet = new Set(rolesRes.data?.filter(r => r.role === "player").map(r => r.user_id) || []);
    const coachSet = new Set(rolesRes.data?.filter(r => r.role === "coach").map(r => r.user_id) || []);
    // Simple approximation: count profiles created per month
    setUserGrowth(months.map(m => {
      const newProfiles = profiles.filter(p => p.created_at >= m.start + "T00:00:00Z" && p.created_at <= m.end + "T23:59:59Z");
      cumPlayers += newProfiles.length; // Approximation
      return { name: m.label, players: cumPlayers, coaches: coachSet.size };
    }));
  };

  const fetchTopPerformers = async () => {
    // Top coaches by revenue
    const { data: bookings } = await supabase.from("bookings").select("coach_id, coach_payout").in("status", ["confirmed", "completed"]);
    const coachRevMap = new Map<string, number>();
    (bookings || []).forEach(b => coachRevMap.set(b.coach_id, (coachRevMap.get(b.coach_id) || 0) + Number(b.coach_payout)));
    const topCoachIds = [...coachRevMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (topCoachIds.length > 0) {
      const { data: names } = await supabase.from("profiles").select("user_id, full_name").in("user_id", topCoachIds.map(c => c[0]));
      const nameMap = new Map((names || []).map(n => [n.user_id, n.full_name]));
      setTopCoaches(topCoachIds.map(([id, rev]) => ({ name: nameMap.get(id) || "Coach", revenue: Math.round(rev) })));
    }

    // Top players by sessions
    const playerSessionMap = new Map<string, number>();
    (bookings || []).forEach(b => playerSessionMap.set(b.coach_id, (playerSessionMap.get(b.coach_id) || 0) + 1)); // reusing coach_id would be wrong, need player_id
    const { data: playerBookings } = await supabase.from("bookings").select("player_id").in("status", ["confirmed", "completed"]);
    const pMap = new Map<string, number>();
    (playerBookings || []).forEach(b => pMap.set(b.player_id, (pMap.get(b.player_id) || 0) + 1));
    const topPlayerIds = [...pMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (topPlayerIds.length > 0) {
      const { data: pNames } = await supabase.from("profiles").select("user_id, full_name").in("user_id", topPlayerIds.map(p => p[0]));
      const pNameMap = new Map((pNames || []).map(n => [n.user_id, n.full_name]));
      setTopPlayers(topPlayerIds.map(([id, count]) => ({ name: pNameMap.get(id) || "Player", sessions: count })));
    }
  };

  const fetchActivityFeed = async () => {
    const { data } = await supabase.from("bookings").select("id, player_id, coach_id, total_price, status, created_at").order("created_at", { ascending: false }).limit(20);
    if (!data || data.length === 0) return;
    const userIds = [...new Set([...data.map(b => b.player_id), ...data.map(b => b.coach_id)])];
    const { data: names } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const nameMap = new Map((names || []).map(n => [n.user_id, n.full_name]));
    setActivityFeed(data.map(b => ({
      id: b.id, player_name: nameMap.get(b.player_id) || "Player",
      coach_name: nameMap.get(b.coach_id) || "Coach",
      amount: Number(b.total_price), status: b.status, created_at: b.created_at,
    })));
  };

  const fetchUnverified = async () => {
    const { data: coaches } = await supabase.from("coach_profiles").select("user_id, location_city, created_at").eq("is_verified", false);
    if (!coaches || coaches.length === 0) return;
    const ids = coaches.map(c => c.user_id).filter(id => !skippedCoaches.includes(id));
    if (ids.length === 0) return;
    const [namesRes, pkgRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", ids),
      supabase.from("coach_packages").select("coach_id").in("coach_id", ids),
    ]);
    const nameMap = new Map((namesRes.data || []).map(n => [n.user_id, n.full_name]));
    const pkgMap = new Map<string, number>();
    (pkgRes.data || []).forEach(p => pkgMap.set(p.coach_id, (pkgMap.get(p.coach_id) || 0) + 1));
    setUnverifiedCoaches(coaches.filter(c => ids.includes(c.user_id)).map(c => ({
      user_id: c.user_id, full_name: nameMap.get(c.user_id) || "Coach",
      location_city: c.location_city, packages_count: pkgMap.get(c.user_id) || 0,
      created_at: c.created_at,
    })));
  };

  const fetchEventStats = async () => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss");
    const [eventsRes, regsRes, recentRes] = await Promise.all([
      supabase.from("events").select("id, start_datetime"),
      supabase.from("event_registrations").select("id, amount_paid, payment_status"),
      supabase.from("events").select("id, title, coach_id, start_datetime, event_type, current_participants, status").order("created_at", { ascending: false }).limit(5),
    ]);
    const allEvents = eventsRes.data || [];
    const thisMonthEvents = allEvents.filter((e: any) => e.start_datetime >= monthStart);
    const regs = regsRes.data || [];
    const paidRegs = regs.filter((r: any) => r.payment_status === "paid");
    const revenue = paidRegs.reduce((sum: number, r: any) => sum + Number(r.amount_paid), 0);
    setEventStats({ total: allEvents.length, thisMonth: thisMonthEvents.length, totalRegs: regs.length, revenue });
    if (recentRes.data && recentRes.data.length > 0) {
      const coachIds = [...new Set((recentRes.data as any[]).map((e: any) => e.coach_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", coachIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      setRecentEvents((recentRes.data as any[]).map((e: any) => ({ ...e, coach_name: nameMap.get(e.coach_id) || "Coach" })));
    }
  };

  const verifyCoach = async (userId: string) => {
    await supabase.from("coach_profiles").update({ is_verified: true }).eq("user_id", userId);
    await supabase.rpc("award_xp", { p_user_id: userId, p_amount: 50, p_event_type: "profile_verified", p_description: "Profile verified by ACE" });
    await supabase.from("notifications").insert({ user_id: userId, title: "Profile Verified! 🎉", body: "Your coach profile is now verified on ACE!", link: "/coach/profile" });
    toast.success("Coach verified");
    setUnverifiedCoaches(prev => prev.filter(c => c.user_id !== userId));
  };

  const skipCoach = (userId: string) => {
    const updated = [...skippedCoaches, userId];
    setSkippedCoaches(updated);
    localStorage.setItem("admin_skipped_coaches", JSON.stringify(updated));
    setUnverifiedCoaches(prev => prev.filter(c => c.user_id !== userId));
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await supabase.functions.invoke("seed-data");
      if (res.error) throw res.error;
      toast.success("Seed complete!", { description: res.data?.details?.slice(0, 5).join("\n") || res.data?.message, duration: 8000 });
      fetchAll();
    } catch (err: any) { toast.error("Seed failed", { description: err.message }); }
    setSeeding(false);
  };

  const statusColor = (s: string) => {
    if (s === "confirmed" || s === "completed") return "bg-green-500/20 text-green-400";
    if (s === "pending") return "bg-amber-500/20 text-amber-400";
    if (s === "cancelled") return "bg-red-500/20 text-red-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-foreground">COMMAND CENTER</h1>
          <button onClick={handleSeed} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-foreground font-display text-xs tracking-wider hover:bg-secondary/80 transition-colors disabled:opacity-50">
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            {seeding ? "SEEDING..." : "SEED TEST DATA"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="flex gap-6">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* SECTION A — Platform Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {[
                  { label: "Total GMV", value: `€${stats.totalGMV.toLocaleString()}`, icon: DollarSign },
                  { label: "MRR", value: `€${stats.mrr.toLocaleString()}`, icon: TrendingUp },
                  { label: "Platform Rev", value: `€${stats.platformRevenue.toLocaleString()}`, icon: CreditCard },
                  { label: "Total Users", value: stats.totalUsers, icon: Users },
                  { label: "Coaches", value: stats.activeCoaches, icon: UserCheck },
                  { label: "Players", value: stats.activePlayers, icon: Activity },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <s.icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-display text-xl text-foreground leading-none">{s.value}</p>
                      <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* SECTION B — Revenue Charts */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-display text-xs tracking-wider text-muted-foreground mb-3">MONTHLY GMV</h2>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gmvData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number, n: string) => [`€${v}`, n === "platform" ? "Platform" : "Coach"]} />
                        <Bar dataKey="platform" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="platform" />
                        <Bar dataKey="coach" stackId="a" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="coach" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-display text-xs tracking-wider text-muted-foreground mb-3">USER GROWTH</h2>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                        <Line type="monotone" dataKey="players" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 2 }} name="Players" />
                        <Line type="monotone" dataKey="coaches" stroke="#a78bfa" strokeWidth={2} dot={{ r: 2 }} name="Coaches" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* SECTION C — Top Performers */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-display text-xs tracking-wider text-muted-foreground mb-3">TOP COACHES BY REVENUE</h2>
                  <div className="space-y-2">
                    {topCoaches.length === 0 ? <p className="font-body text-xs text-muted-foreground text-center py-4">No data yet</p> :
                      topCoaches.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-display text-xs text-muted-foreground w-4">{i + 1}</span>
                          <span className="font-body text-xs text-foreground flex-1 truncate">{c.name}</span>
                          <span className="font-display text-xs text-primary">€{c.revenue}</span>
                        </div>
                      ))}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-display text-xs tracking-wider text-muted-foreground mb-3">TOP PLAYERS BY SESSIONS</h2>
                  <div className="space-y-2">
                    {topPlayers.length === 0 ? <p className="font-body text-xs text-muted-foreground text-center py-4">No data yet</p> :
                      topPlayers.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-display text-xs text-muted-foreground w-4">{i + 1}</span>
                          <span className="font-body text-xs text-foreground flex-1 truncate">{p.name}</span>
                          <span className="font-display text-xs text-primary">{p.sessions}</span>
                        </div>
                      ))}
                  </div>
                </motion.div>
              </div>

              {/* SECTION E — Coach Verification Queue */}
              {unverifiedCoaches.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-xl p-5 mb-6">
                  <h2 className="font-display text-xs tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary" /> VERIFICATION QUEUE
                  </h2>
                  <div className="space-y-2">
                    {unverifiedCoaches.map(c => (
                      <div key={c.user_id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-foreground">{c.full_name}</p>
                          <p className="text-[10px] font-body text-muted-foreground">
                            {c.location_city || "No location"} · {c.packages_count} packages · Joined {format(new Date(c.created_at), "d MMM yyyy")}
                          </p>
                        </div>
                        <button onClick={() => verifyCoach(c.user_id)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-[9px] tracking-wider">VERIFY</button>
                        <button onClick={() => skipCoach(c.user_id)} className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground font-display text-[9px] tracking-wider">SKIP</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SECTION F — Platform Health */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Avg Booking", value: `€${Math.round(stats.avgBookingValue)}` },
                  { label: "Coach Retention", value: `${stats.coachRetention}%` },
                  { label: "Player Retention", value: `${stats.playerRetention}%` },
                  { label: "Referral Conv.", value: `${stats.referralConversion}%` },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                    <p className="font-display text-lg text-foreground">{s.value}</p>
                    <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* SECTION D — Live Activity Feed (sidebar) */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="hidden lg:block w-72 shrink-0">
              <div className="bg-card border border-border rounded-xl p-4 sticky top-20">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-xs tracking-wider text-muted-foreground">LIVE ACTIVITY</h2>
                  <RefreshCw size={10} className="text-muted-foreground animate-spin" style={{ animationDuration: "3s" }} />
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {activityFeed.length === 0 ? <p className="font-body text-xs text-muted-foreground text-center py-4">No bookings yet</p> :
                    activityFeed.map(b => (
                      <div key={b.id} className="p-2 rounded-lg bg-muted/20 space-y-0.5">
                        <p className="text-[10px] font-body text-foreground">
                          <span className="font-display">{b.player_name}</span> → <span className="font-display">{b.coach_name}</span>
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-display text-[10px] text-primary">€{b.amount}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-display ${statusColor(b.status)}`}>{b.status}</span>
                        </div>
                        <p className="text-[8px] font-body text-muted-foreground">
                          {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default AdminDashboard;
