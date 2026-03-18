import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Users, BookOpen, Calendar, ChevronRight, ShoppingBag, Mail, Check, X as XIcon,
  TrendingUp, TrendingDown, DollarSign, Star, CreditCard, CalendarDays, ChevronLeft, ChevronDown, ChevronUp
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, addDays, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subWeeks, addWeeks } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Line, ComposedChart } from "recharts";
import PortalLayout from "@/components/portal/PortalLayout";
import IncomingBookings from "@/components/portal/IncomingBookings";
import SportPickerModal from "@/components/portal/SportPickerModal";
import { toast } from "sonner";

interface CoachRequest {
  id: string; player_id: string; player_name: string;
  block_title: string | null; message: string | null;
  request_type: string; created_at: string;
}

interface PlayerCard {
  player_id: string; full_name: string; avatar_url: string | null;
  current_level: string | null; sessions_this_month: number; last_session: string | null;
}

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

const CoachDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CoachRequest[]>([]);
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [stats, setStats] = useState({ players: 0, sessionsMonth: 0, revenueMonth: 0, avgRating: 0, lastMonthSessions: 0, lastMonthRevenue: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState({ published: 0, sales: 0, revenue: 0 });
  const [weekBookings, setWeekBookings] = useState<any[]>([]);
  const [showSportPicker, setShowSportPicker] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAll();
      checkSportSelection();
    }
  }, [user]);

  const checkSportSelection = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("coach_profiles")
      .select("primary_sport")
      .eq("user_id", user.id)
      .single();
    if (!data?.primary_sport) setShowSportPicker(true);
  };

  const fetchAll = async () => {
    if (!user) return;
    const now = new Date();
    const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const thisMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");
    const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
    const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

    // All fetches in parallel
    const [assignRes, bookThisRes, bookLastRes, reviewRes, reqRes, pubRes, salesRes, weekRes] = await Promise.all([
      supabase.from("coach_player_assignments").select("player_id").eq("coach_id", user.id),
      supabase.from("bookings").select("id, coach_payout, player_id, booking_date").eq("coach_id", user.id).gte("booking_date", thisMonthStart).lte("booking_date", thisMonthEnd).in("status", ["confirmed", "completed"]),
      supabase.from("bookings").select("id, coach_payout").eq("coach_id", user.id).gte("booking_date", lastMonthStart).lte("booking_date", lastMonthEnd).in("status", ["confirmed", "completed"]),
      supabase.from("reviews").select("rating").eq("coach_id", user.id),
      supabase.from("coach_requests").select("id, player_id, block_id, message, request_type, created_at").eq("coach_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("training_blocks").select("id", { count: "exact", head: true }).eq("coach_id", user.id).eq("is_public", true),
      supabase.from("block_purchases").select("amount_paid, platform_fee").eq("seller_id", user.id),
      supabase.from("bookings").select("booking_date, player_id, start_time").eq("coach_id", user.id).gte("booking_date", format(now, "yyyy-MM-dd")).lte("booking_date", format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd")).eq("status", "confirmed"),
    ]);

    const playerIds = assignRes.data?.map(a => a.player_id) || [];
    const thisMonthBookings = bookThisRes.data || [];
    const lastMonthBookings = bookLastRes.data || [];
    const reviews = reviewRes.data || [];
    const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    setStats({
      players: playerIds.length,
      sessionsMonth: thisMonthBookings.length,
      revenueMonth: thisMonthBookings.reduce((s, b) => s + Number(b.coach_payout), 0),
      avgRating: Math.round(avgRating * 10) / 10,
      lastMonthSessions: lastMonthBookings.length,
      lastMonthRevenue: lastMonthBookings.reduce((s, b) => s + Number(b.coach_payout), 0),
    });

    // Revenue chart (last 6 months)
    const months: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      months.push({ label: format(m, "MMM"), start: format(startOfMonth(m), "yyyy-MM-dd"), end: format(endOfMonth(m), "yyyy-MM-dd") });
    }
    const { data: allBookings } = await supabase.from("bookings").select("coach_payout, booking_date")
      .eq("coach_id", user.id).gte("booking_date", months[0].start).in("status", ["confirmed", "completed"]);
    setRevenueData(months.map(m => {
      const monthBookings = (allBookings || []).filter(b => b.booking_date >= m.start && b.booking_date <= m.end);
      return { name: m.label, earnings: monthBookings.reduce((s, b) => s + Number(b.coach_payout), 0), sessions: monthBookings.length };
    }));

    // Player cards
    if (playerIds.length > 0) {
      const [profilesRes, leaderRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", playerIds),
        supabase.from("leaderboard").select("user_id, current_level").in("user_id", playerIds),
      ]);
      const lvlMap = new Map((leaderRes.data || []).map(l => [l.user_id, l.current_level]));
      setPlayerCards((profilesRes.data || []).map(p => {
        const playerBookings = thisMonthBookings.filter(b => b.player_id === p.user_id);
        const lastBooking = playerBookings.length > 0 ? playerBookings.sort((a, b) => b.booking_date.localeCompare(a.booking_date))[0]?.booking_date : null;
        return {
          player_id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url,
          current_level: lvlMap.get(p.user_id) || "bronze",
          sessions_this_month: playerBookings.length, last_session: lastBooking,
        };
      }));
    }

    // Requests
    if (reqRes.data && reqRes.data.length > 0) {
      const rPlayerIds = reqRes.data.map(r => r.player_id);
      const blockIds = reqRes.data.filter(r => r.block_id).map(r => r.block_id);
      const [pRes, bRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", rPlayerIds),
        blockIds.length > 0 ? supabase.from("training_blocks").select("id, title").in("id", blockIds) : { data: [] },
      ]);
      const nameMap = new Map(pRes.data?.map(p => [p.user_id, p.full_name]) || []);
      const blockMap = new Map((bRes.data as any[])?.map((b: any) => [b.id, b.title]) || []);
      setRequests(reqRes.data.map(r => ({ ...r, player_name: nameMap.get(r.player_id) || "Player", block_title: r.block_id ? blockMap.get(r.block_id) || null : null })));
    }

    setMarketplaceStats({
      published: pubRes.count || 0,
      sales: salesRes.data?.length || 0,
      revenue: salesRes.data?.reduce((s, p) => s + (Number(p.amount_paid) - Number(p.platform_fee || 0)), 0) || 0,
    });

    setWeekBookings(weekRes.data || []);
  };

  const firstName = profile?.full_name?.split(" ")[0]?.toUpperCase() || "COACH";
  const sessionsTrend = stats.sessionsMonth - stats.lastMonthSessions;
  const revenueTrend = stats.revenueMonth - stats.lastMonthRevenue;

  const LEVEL_COLORS: Record<string, string> = { bronze: "#CD7F32", silver: "#C0C0C0", gold: "#FFD700", platinum: "#E5E4E2", diamond: "#B9F2FF", legend: "#FF69B4" };

  // Week strip with offset
  const [weekOffset, setWeekOffset] = useState(0);
  const [showMonthView, setShowMonthView] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());

  const weekStart = addDays(new Date(), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE"), day: format(d, "d"), dateObj: d };
  });

  return (
    <PortalLayout>
      {showSportPicker && user && (
        <SportPickerModal
          userId={user.id}
          onComplete={() => {
            setShowSportPicker(false);
            fetchAll();
          }}
        />
      )}
      <div className="max-w-5xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl md:text-4xl text-foreground mb-6">
          WELCOME, {firstName}
        </motion.h1>

        {/* SECTION A — Hero Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Users size={18} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground"><AnimatedNumber value={stats.players} /></p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Players</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Calendar size={18} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground"><AnimatedNumber value={stats.sessionsMonth} /></p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Sessions</p>
            <p className={`text-[9px] font-body flex items-center justify-center gap-0.5 mt-0.5 ${sessionsTrend >= 0 ? "text-green-400" : "text-red-400"}`}>
              {sessionsTrend >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />} {sessionsTrend >= 0 ? "+" : ""}{sessionsTrend} vs last month
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <CreditCard size={18} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground"><AnimatedNumber value={Math.round(stats.revenueMonth)} prefix="€" /></p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</p>
            <p className={`text-[9px] font-body flex items-center justify-center gap-0.5 mt-0.5 ${revenueTrend >= 0 ? "text-green-400" : "text-red-400"}`}>
              {revenueTrend >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />} €{Math.abs(Math.round(revenueTrend))}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Star size={18} className="text-amber-400 mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Avg Rating</p>
          </div>
        </motion.div>

        {/* SECTION B — Revenue Chart */}
        {revenueData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <DollarSign size={14} className="text-primary" /> EARNINGS (6 MONTHS)
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                    formatter={(val: number, name: string) => [name === "earnings" ? `€${val}` : val, name === "earnings" ? "Earnings" : "Sessions"]} />
                  <Bar yAxisId="left" dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="earnings" />
                  <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} name="sessions" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* SECTION C — Player Progress Strip */}
        {playerCards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm tracking-wider text-muted-foreground">PLAYER PROGRESS</h3>
              <Link to="/coach/players" className="text-xs font-display text-primary tracking-wider hover:underline">VIEW ALL →</Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {playerCards.slice(0, 8).map(p => (
                <Link key={p.player_id} to={`/coach/players/${p.player_id}`} className="shrink-0 w-32 bg-card border border-border rounded-xl p-3 text-center hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 rounded-full mx-auto mb-1.5 overflow-hidden bg-secondary">
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center font-display text-primary text-sm">{p.full_name?.charAt(0)}</div>}
                  </div>
                  <p className="font-display text-xs text-foreground truncate">{p.full_name}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS[p.current_level || "bronze"] }} />
                    <span className="text-[8px] font-body text-muted-foreground uppercase">{p.current_level}</span>
                  </div>
                  <p className="text-[9px] font-body text-muted-foreground mt-1">{p.sessions_this_month} sessions</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* SECTION D — Marketplace Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
              <ShoppingBag size={14} className="text-primary" /> MARKETPLACE
            </h3>
            <Link to="/coach/marketplace" className="text-xs font-display text-primary tracking-wider hover:underline">MANAGE →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="font-display text-xl text-foreground">{marketplaceStats.published}</p>
              <p className="font-body text-[9px] text-muted-foreground uppercase">Published</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="font-display text-xl text-foreground">{marketplaceStats.sales}</p>
              <p className="font-body text-[9px] text-muted-foreground uppercase">Sales</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="font-display text-xl text-foreground">€{marketplaceStats.revenue.toFixed(0)}</p>
              <p className="font-body text-[9px] text-muted-foreground uppercase">Earnings</p>
            </div>
          </div>
        </motion.div>

        {/* SECTION E — Week Strip */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground">UPCOMING WEEK</h3>
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setShowMonthView(!showMonthView)}
                className={`p-1.5 rounded-lg transition-colors ${showMonthView ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"}`}
              >
                <CalendarDays size={14} />
              </button>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                <ChevronRight size={14} />
              </button>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} className="ml-1 px-2 py-1 rounded-lg bg-primary/10 font-display text-[9px] tracking-wider text-primary hover:bg-primary/20 transition-colors">
                  TODAY
                </button>
              )}
            </div>
          </div>

          {/* Month calendar overlay */}
          {showMonthView && (() => {
            const ms = startOfMonth(calMonth);
            const me = endOfMonth(calMonth);
            const cs = startOfWeek(ms, { weekStartsOn: 1 });
            const days: Date[] = [];
            let cur = cs;
            while (cur <= me || days.length % 7 !== 0) { days.push(cur); cur = addDays(cur, 1); }
            return (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-3 bg-card border border-border rounded-xl p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronLeft size={14} /></button>
                  <p className="font-display text-xs tracking-wider text-foreground">{format(calMonth, "MMMM yyyy").toUpperCase()}</p>
                  <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><ChevronRight size={14} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["M","T","W","T","F","S","S"].map((d,i) => (
                    <div key={i} className="text-center font-display text-[9px] text-muted-foreground py-0.5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map(day => {
                    const val = format(day, "yyyy-MM-dd");
                    const isToday = isSameDay(day, new Date());
                    const inMonth = isSameMonth(day, calMonth);
                    const hasBooking = weekBookings.some(b => b.booking_date === val);
                    return (
                      <button
                        key={val}
                        onClick={() => {
                          const diff = Math.floor((day.getTime() - new Date().setHours(0,0,0,0)) / (1000*60*60*24));
                          setWeekOffset(Math.floor(diff / 7));
                          setShowMonthView(false);
                        }}
                        className={`aspect-square rounded-lg text-center font-body text-[11px] transition-all relative flex items-center justify-center ${
                          !inMonth ? "text-muted-foreground/20"
                            : isToday ? "bg-primary/15 text-foreground ring-1 ring-primary/40"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        {format(day, "d")}
                        {hasBooking && inMonth && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}

          <div className="flex gap-2">
            {weekDays.map(d => {
              const dayBookings = weekBookings.filter(b => b.booking_date === d.date);
              const isToday = d.date === format(new Date(), "yyyy-MM-dd");
              return (
                <div key={d.date} className={`flex-1 py-2 rounded-lg text-center relative ${isToday ? "bg-primary/10 border border-primary/30" : "bg-card border border-border"}`}>
                  <span className="font-display text-xs text-muted-foreground block">{d.label}</span>
                  <span className="font-body text-xs text-foreground">{d.day}</span>
                  <div className="flex justify-center gap-0.5 mt-1">
                    {dayBookings.slice(0, 3).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Coaching Requests */}
        {requests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm tracking-wider text-foreground flex items-center gap-2">
                <Mail size={16} className="text-primary" /> COACHING REQUESTS
              </h2>
              <span className="text-xs font-body text-primary">{requests.length} pending</span>
            </div>
            <div className="space-y-2">
              {requests.map(req => (
                <div key={req.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs">{req.player_name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-foreground">{req.player_name}</p>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {req.request_type === "guide_program" ? "Program guidance" : req.request_type === "book_session" ? "Session booking" : "Full coaching"}
                        {req.block_title && ` · ${req.block_title}`}
                      </p>
                    </div>
                  </div>
                  {req.message && <p className="text-xs font-body text-muted-foreground italic">"{req.message}"</p>}
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      await supabase.from("coach_requests").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", req.id);
                      await supabase.from("coach_player_assignments").insert({ coach_id: user!.id, player_id: req.player_id });
                      toast.success("Request accepted!"); setRequests(prev => prev.filter(r => r.id !== req.id));
                    }} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider flex items-center justify-center gap-1">
                      <Check size={12} /> ACCEPT
                    </button>
                    <button onClick={async () => {
                      await supabase.from("coach_requests").update({ status: "declined", responded_at: new Date().toISOString() }).eq("id", req.id);
                      toast.success("Request declined"); setRequests(prev => prev.filter(r => r.id !== req.id));
                    }} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground font-display text-[10px] tracking-wider flex items-center justify-center gap-1">
                      <XIcon size={12} /> DECLINE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Incoming Bookings */}
        <IncomingBookings />
      </div>
    </PortalLayout>
  );
};

export default CoachDashboard;
