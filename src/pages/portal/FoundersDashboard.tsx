import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import {
  RefreshCw, Download, ChevronDown, ChevronRight, TrendingUp, Users,
  AlertTriangle, Zap, Target, Send, Copy, MapPin, Crown, Eye,
  Plus, Trash2, Share2, CheckCircle2, PartyPopper, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Animated Counter ────────────────────────────────────
const AnimatedNumber = ({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(value * p);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return (
    <span className="font-display text-2xl text-foreground tabular-nums">
      {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}{suffix}
    </span>
  );
};

// ─── Metric Card ─────────────────────────────────────────
const MetricCard = ({ label, value, prefix, suffix, decimals, highlight, color }: {
  label: string; value: number; prefix?: string; suffix?: string; decimals?: number; highlight?: boolean; color?: string;
}) => (
  <Card className={`${highlight ? "border-destructive/50" : ""}`} style={color ? { borderColor: color } : undefined}>
    <CardContent className="p-4">
      <p className="text-[10px] font-body uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
    </CardContent>
  </Card>
);

// ─── Collapsible Section ─────────────────────────────────
const Section = ({ title, borderColor, children, id, onExport }: {
  title: string; borderColor: string; children: React.ReactNode; id: string;
  onExport?: () => void;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className={`border-l-4 rounded-lg bg-card/50 mb-6`} style={{ borderLeftColor: borderColor }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          <span className="font-display text-lg tracking-wide text-foreground">{title}</span>
        </div>
        {onExport && (
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onExport(); }}>
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── CSV Helper ──────────────────────────────────────────
const downloadCSV = (rows: Record<string, any>[], filename: string) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
};

// ─── Chart Colors ────────────────────────────────────────
const COLORS = ["hsl(0,90%,45%)", "hsl(210,80%,55%)", "hsl(270,70%,55%)", "hsl(170,70%,45%)", "hsl(45,90%,55%)", "hsl(330,70%,55%)"];
const LEVEL_COLORS: Record<string, string> = {
  bronze: "#CD7F32", silver: "#C0C0C0", gold: "#FFD700",
  platinum: "#E5E4E2", diamond: "#B9F2FF", legend: "#FF69B4",
};
const TT_STYLE = { background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 };
const TICK_STYLE = { fontSize: 10, fill: "hsl(0,10%,60%)" };

// ─── Gauge SVG ───────────────────────────────────────────
const ArcGauge = ({ score }: { score: number }) => {
  const pct = Math.min(Math.max(score, 0), 100);
  const color = pct >= 80 ? "#FFD700" : pct >= 60 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
  const r = 80, cx = 100, cy = 90;
  const startAngle = Math.PI, endAngle = 0;
  const angle = startAngle - (pct / 100) * Math.PI;
  const x1 = cx + r * Math.cos(startAngle), y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(angle), y2 = cy - r * Math.sin(angle);
  const largeArc = pct > 50 ? 1 : 0;
  return (
    <svg viewBox="0 0 200 110" className="w-48 mx-auto">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(0,10%,20%)" strokeWidth={12} strokeLinecap="round" />
      <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
      <text x={cx} y={cy - 10} textAnchor="middle" className="font-display text-3xl" fill={color}>{Math.round(pct)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="text-[10px]" fill="hsl(0,10%,60%)">/ 100</text>
    </svg>
  );
};

// ─── Main Component ─────────────────────────────────────
const FoundersDashboard = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get("token");
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(!!shareToken);

  // Validate share token
  useEffect(() => {
    if (!shareToken) return;
    supabase
      .from("founder_share_tokens")
      .select("expires_at")
      .eq("token", shareToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()
      .then(({ data }) => {
        setTokenValid(!!data);
        setCheckingToken(false);
      });
  }, [shareToken]);

  const isReadOnly = !!shareToken && tokenValid && !user;
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [d, setD] = useState<any>({});
  const [expansionModal, setExpansionModal] = useState(false);
  const [investorModal, setInvestorModal] = useState(false);
  const [expansionCities, setExpansionCities] = useState<any[]>([]);

  // Section 8 state
  const [spendRows, setSpendRows] = useState<any[]>([]);
  const [newSpend, setNewSpend] = useState({ month: "", category: "marketing", amount: "", notes: "" });
  const [showSpendForm, setShowSpendForm] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: bookings },
        { data: profiles },
        { data: userRoles },
        { data: referrals },
        { data: playerProfiles },
        { data: coachProfiles },
        { data: coachPackages },
        { data: reviews },
        { data: trainingBlocks },
        { data: blockPurchases },
        { data: playerRackets },
        { data: modules },
        { data: planItems },
        { data: healthConns },
        { data: userStats },
        { data: userBadges },
        { data: leaderboard },
        { data: walletTx },
        { data: events },
        { data: eventRegs },
        { data: notifications },
        { data: founderSpend },
        { data: pageViews },
        { data: progressVideos },
      ] = await Promise.all([
        supabase.from("bookings").select("*"),
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
        supabase.from("referrals").select("*"),
        supabase.from("player_profiles").select("*"),
        supabase.from("coach_profiles").select("*"),
        supabase.from("coach_packages").select("*"),
        supabase.from("reviews").select("*"),
        supabase.from("training_blocks").select("*"),
        supabase.from("block_purchases").select("*"),
        supabase.from("player_rackets").select("*"),
        supabase.from("modules").select("*"),
        supabase.from("player_day_plan_items").select("*, modules:module_id(category)"),
        supabase.from("health_connections").select("*"),
        supabase.from("user_stats").select("*"),
        supabase.from("user_badges").select("*"),
        supabase.from("leaderboard").select("*"),
        supabase.from("wallet_transactions").select("*"),
        supabase.from("events").select("*"),
        supabase.from("event_registrations").select("*"),
        supabase.from("notifications").select("id"),
        supabase.from("founder_spend").select("*").order("month", { ascending: false }),
        supabase.from("page_views").select("*"),
        supabase.from("progress_videos").select("id"),
      ]);

      setD({
        bookings: bookings || [], profiles: profiles || [], userRoles: userRoles || [],
        referrals: referrals || [], playerProfiles: playerProfiles || [],
        coachProfiles: coachProfiles || [], coachPackages: coachPackages || [],
        reviews: reviews || [], trainingBlocks: trainingBlocks || [],
        blockPurchases: blockPurchases || [], playerRackets: playerRackets || [],
        modules: modules || [], planItems: planItems || [],
        healthConns: healthConns || [], userStats: userStats || [],
        userBadges: userBadges || [], leaderboard: leaderboard || [],
        walletTx: walletTx || [], events: events || [], eventRegs: eventRegs || [],
        founderSpend: founderSpend || [], pageViews: pageViews || [],
        progressVideos: progressVideos || [],
      });
      setSpendRows(founderSpend || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      toast("Failed to load data");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── SECTION 1: BUSINESS HEALTH ─────────────────────
  const biz = useMemo(() => {
    const b = d.bookings || [];
    const confirmed = b.filter((x: any) => ["confirmed", "completed"].includes(x.status));
    const gmv = confirmed.reduce((s: number, x: any) => s + Number(x.total_price || 0), 0);
    const platformRev = confirmed.reduce((s: number, x: any) => s + Number(x.platform_fee || 0), 0);
    const now = new Date();
    const thisMonth = confirmed.filter((x: any) => {
      const d = new Date(x.booking_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const mrr = thisMonth.reduce((s: number, x: any) => s + Number(x.total_price || 0), 0);
    const players = (d.userRoles || []).filter((r: any) => r.role === "player");
    const completedRefs = (d.referrals || []).filter((r: any) => r.status === "completed");
    const totalUsers = (d.profiles || []).length;

    const monthlyRev: Record<string, { gmv: number; fees: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      monthlyRev[key] = { gmv: 0, fees: 0 };
    }
    confirmed.forEach((x: any) => {
      const d = new Date(x.booking_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyRev[key]) {
        monthlyRev[key].gmv += Number(x.total_price || 0);
        monthlyRev[key].fees += Number(x.platform_fee || 0);
      }
    });
    const revChart = Object.entries(monthlyRev).map(([m, v]) => ({ month: m.slice(5), gmv: v.gmv, fees: v.fees }));

    const monthlyGrowth: Record<string, { players: number; coaches: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      monthlyGrowth[key] = { players: 0, coaches: 0 };
    }
    (d.profiles || []).forEach((p: any) => {
      const dt = new Date(p.created_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const role = (d.userRoles || []).find((r: any) => r.user_id === p.user_id);
      if (monthlyGrowth[key]) {
        if (role?.role === "coach") monthlyGrowth[key].coaches++;
        else monthlyGrowth[key].players++;
      }
    });
    const growthChart = Object.entries(monthlyGrowth).map(([m, v]) => ({ month: m.slice(5), players: v.players, coaches: v.coaches }));

    // Last month GMV for growth calc
    const lastMonthKey = Object.keys(monthlyRev).slice(-2, -1)[0];
    const lastMonthGMV = lastMonthKey ? monthlyRev[lastMonthKey]?.gmv || 0 : 0;
    const thisMonthFees = thisMonth.reduce((s: number, x: any) => s + Number(x.platform_fee || 0), 0);

    return {
      gmv, mrr, arr: mrr * 12, platformRev,
      avgBooking: confirmed.length ? gmv / confirmed.length : 0,
      revPerUser: players.length ? gmv / players.length : 0,
      takeRate: gmv > 0 ? (platformRev / gmv) * 100 : 0,
      viralCoeff: totalUsers > 0 ? (completedRefs.length / totalUsers) * 100 : 0,
      revChart, growthChart, lastMonthGMV, thisMonthFees,
      confirmedCount: confirmed.length,
    };
  }, [d]);

  // ─── SECTION 2: CUSTOMER INTELLIGENCE ───────────────
  const cust = useMemo(() => {
    const pp = d.playerProfiles || [];
    const b = d.bookings || [];
    const now = new Date();
    const ageBuckets: Record<string, number> = { "Under 18": 0, "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "55+": 0 };
    pp.forEach((p: any) => {
      if (!p.date_of_birth) return;
      const age = Math.floor((now.getTime() - new Date(p.date_of_birth).getTime()) / 31557600000);
      if (age < 18) ageBuckets["Under 18"]++;
      else if (age <= 25) ageBuckets["18-25"]++;
      else if (age <= 35) ageBuckets["26-35"]++;
      else if (age <= 45) ageBuckets["36-45"]++;
      else if (age <= 55) ageBuckets["46-55"]++;
      else ageBuckets["55+"]++;
    });
    const ageChart = Object.entries(ageBuckets).map(([name, value]) => ({ name, value }));
    const sportCount: Record<string, number> = { tennis: 0, padel: 0, both: 0 };
    pp.forEach((p: any) => { if (p.preferred_sport && sportCount[p.preferred_sport] !== undefined) sportCount[p.preferred_sport]++; });
    const sportChart = Object.entries(sportCount).map(([name, value]) => ({ name, value }));
    const fitCount: Record<string, number> = {};
    pp.forEach((p: any) => { if (p.fitness_level) fitCount[p.fitness_level] = (fitCount[p.fitness_level] || 0) + 1; });
    const fitnessChart = Object.entries(fitCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const hourCounts = new Array(24).fill(0);
    let totalLeadTime = 0;
    let leadCount = 0;
    const cancelled = b.filter((x: any) => x.status === "cancelled").length;
    b.forEach((x: any) => {
      const bd = new Date(x.booking_date);
      dayCounts[bd.getDay()]++;
      if (x.start_time) {
        const h = parseInt(x.start_time.split(":")[0]);
        if (!isNaN(h)) hourCounts[h]++;
      }
      if (x.created_at && x.booking_date) {
        const diff = (new Date(x.booking_date).getTime() - new Date(x.created_at).getTime()) / 86400000;
        if (diff >= 0) { totalLeadTime += diff; leadCount++; }
      }
    });
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const peakDay = dayNames[dayCounts.indexOf(Math.max(...dayCounts))];
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const avgLeadTime = leadCount > 0 ? totalLeadTime / leadCount : 0;
    const cancelRate = b.length > 0 ? (cancelled / b.length) * 100 : 0;
    const freqCount: Record<string, number> = {};
    pp.forEach((p: any) => { if (p.training_freq) freqCount[p.training_freq] = (freqCount[p.training_freq] || 0) + 1; });
    const freqChart = Object.entries(freqCount).map(([name, value]) => ({ name, value }));
    const cityData: Record<string, { players: number; coaches: number; bookings: number; revenue: number }> = {};
    pp.forEach((p: any) => {
      const city = p.club_location;
      if (city) {
        if (!cityData[city]) cityData[city] = { players: 0, coaches: 0, bookings: 0, revenue: 0 };
        cityData[city].players++;
      }
    });
    (d.coachProfiles || []).forEach((c: any) => {
      const city = c.location_city;
      if (city) {
        if (!cityData[city]) cityData[city] = { players: 0, coaches: 0, bookings: 0, revenue: 0 };
        cityData[city].coaches++;
      }
    });
    const topCities = Object.entries(cityData)
      .sort((a, b) => b[1].players - a[1].players)
      .slice(0, 20)
      .map(([city, data], i) => ({ rank: i + 1, city, ...data, avgBookingValue: data.bookings > 0 ? data.revenue / data.bookings : 0 }));
    return { ageChart, sportChart, fitnessChart, peakDay, peakHour, avgLeadTime, cancelRate, freqChart, topCities };
  }, [d]);

  // ─── SECTION 3: COACH INTELLIGENCE ──────────────────
  const coach = useMemo(() => {
    const cp = d.coachProfiles || [];
    const pkgs = d.coachPackages || [];
    const b = d.bookings || [];
    const rev = d.reviews || [];
    const prof = d.profiles || [];
    const totalCoaches = cp.length;
    const verified = cp.filter((c: any) => c.is_verified).length;
    const coachIdsWithBookings = new Set(b.map((x: any) => x.coach_id));
    const zeroBookingCoaches = cp.filter((c: any) => !coachIdsWithBookings.has(c.user_id)).length;
    const avgPkgs = totalCoaches > 0 ? pkgs.length / totalCoaches : 0;
    const avgPrice = pkgs.length > 0 ? pkgs.reduce((s: number, p: any) => s + Number(p.price_per_session || 0), 0) / pkgs.length : 0;
    const coachRevMap: Record<string, number> = {};
    b.filter((x: any) => ["confirmed", "completed"].includes(x.status)).forEach((x: any) => {
      coachRevMap[x.coach_id] = (coachRevMap[x.coach_id] || 0) + Number(x.coach_payout || 0);
    });
    const coachSessionMap: Record<string, number> = {};
    b.filter((x: any) => ["confirmed", "completed"].includes(x.status)).forEach((x: any) => {
      coachSessionMap[x.coach_id] = (coachSessionMap[x.coach_id] || 0) + 1;
    });
    const coachRatingMap: Record<string, { sum: number; count: number }> = {};
    rev.forEach((r: any) => {
      if (!coachRatingMap[r.coach_id]) coachRatingMap[r.coach_id] = { sum: 0, count: 0 };
      coachRatingMap[r.coach_id].sum += Number(r.rating);
      coachRatingMap[r.coach_id].count++;
    });
    const topCoaches = cp
      .map((c: any) => {
        const p = prof.find((pr: any) => pr.user_id === c.user_id);
        const rating = coachRatingMap[c.user_id];
        return {
          userId: c.user_id, name: p?.full_name || "Unknown", location: c.location_city || "-",
          sessions: coachSessionMap[c.user_id] || 0, revenue: coachRevMap[c.user_id] || 0,
          avgRating: rating ? (rating.sum / rating.count).toFixed(1) : "-",
          badge: c.badge_level, verified: c.is_verified,
        };
      })
      .sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const recentBookingCoachIds = new Set(
      b.filter((x: any) => x.booking_date >= thirtyDaysAgo.split("T")[0]).map((x: any) => x.coach_id)
    );
    const atRiskCoaches = cp
      .filter((c: any) => c.is_verified && !recentBookingCoachIds.has(c.user_id))
      .map((c: any) => {
        const p = prof.find((pr: any) => pr.user_id === c.user_id);
        const pkgCount = pkgs.filter((pk: any) => pk.coach_id === c.user_id).length;
        return { userId: c.user_id, name: p?.full_name || "Unknown", avatar: p?.avatar_url, location: c.location_city, pkgCount };
      });
    const badgeCounts: Record<string, number> = { starter: 0, pro: 0, elite: 0, legend: 0 };
    cp.forEach((c: any) => { if (badgeCounts[c.badge_level] !== undefined) badgeCounts[c.badge_level]++; });
    const badgeChart = Object.entries(badgeCounts).map(([name, value]) => ({ name, value }));
    const tb = d.trainingBlocks || [];
    const bp = d.blockPurchases || [];
    const published = tb.filter((t: any) => t.is_for_sale).length;
    const sold = bp.length;
    const marketplaceGMV = bp.reduce((s: number, p: any) => s + Number(p.amount_paid || 0), 0);
    const blockRevMap: Record<string, { name: string; author: string; sales: number; revenue: number }> = {};
    bp.forEach((p: any) => {
      if (!blockRevMap[p.block_id]) {
        const block = tb.find((t: any) => t.id === p.block_id);
        blockRevMap[p.block_id] = { name: block?.title || "Unknown", author: block?.author_name || "-", sales: 0, revenue: 0 };
      }
      blockRevMap[p.block_id].sales++;
      blockRevMap[p.block_id].revenue += Number(p.amount_paid || 0);
    });
    const topPrograms = Object.values(blockRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    return {
      totalCoaches, verified, verifiedPct: totalCoaches > 0 ? (verified / totalCoaches) * 100 : 0,
      zeroBookingCoaches, avgPkgs, avgPrice, topCoaches, atRiskCoaches,
      badgeChart, published, sold, marketplaceGMV, topPrograms,
    };
  }, [d]);

  // ─── SECTION 4: PRODUCT & EQUIPMENT ─────────────────
  const equip = useMemo(() => {
    const rackets = d.playerRackets || [];
    const pp = d.playerProfiles || [];
    const items = d.planItems || [];
    const hc = d.healthConns || [];
    const brandCount: Record<string, number> = {};
    rackets.forEach((r: any) => {
      const brand = (r.brand || "").trim().toLowerCase();
      if (brand) brandCount[brand] = (brandCount[brand] || 0) + 1;
    });
    const brandChart = Object.entries(brandCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    const typeCount: Record<string, number> = { power: 0, control: 0, mixed: 0 };
    rackets.forEach((r: any) => { if (r.type && typeCount[r.type] !== undefined) typeCount[r.type]++; });
    const typeChart = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
    const leftHand = pp.filter((p: any) => p.dominant_hand === "left").length;
    const rightHand = pp.filter((p: any) => p.dominant_hand === "right").length;
    const stringCount: Record<string, number> = {};
    rackets.forEach((r: any) => {
      const sb = (r.string_brand || "").trim();
      if (sb) stringCount[sb] = (stringCount[sb] || 0) + 1;
    });
    const topStrings = Object.entries(stringCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const catCount: Record<string, number> = {};
    items.forEach((item: any) => {
      const cat = (item as any).modules?.category;
      if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const moduleChart = Object.entries(catCount).sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
    const connected = hc.filter((h: any) => h.is_connected);
    const providerCount: Record<string, number> = {};
    connected.forEach((h: any) => { providerCount[h.provider] = (providerCount[h.provider] || 0) + 1; });
    const healthChart = Object.entries(providerCount).map(([name, value]) => ({ name, value }));
    const activePlayers = (d.userRoles || []).filter((r: any) => r.role === "player").length;
    const healthPct = activePlayers > 0 ? (new Set(connected.map((h: any) => h.user_id)).size / activePlayers) * 100 : 0;
    return { brandChart, typeChart, leftHand, rightHand, topStrings, moduleChart, healthChart, healthPct };
  }, [d]);

  // ─── SECTION 5: LOST OPPORTUNITIES ──────────────────
  const lost = useMemo(() => {
    const profiles = d.profiles || [];
    const pp = d.playerProfiles || [];
    const b = d.bookings || [];
    const cp = d.coachProfiles || [];
    const pkgs = d.coachPackages || [];
    const totalSignups = profiles.length;
    const profileCompleted = pp.filter((p: any) => p.date_of_birth !== null).length;
    const playersWithBooking = new Set(b.map((x: any) => x.player_id)).size;
    const playerBookingCount: Record<string, number> = {};
    b.forEach((x: any) => { playerBookingCount[x.player_id] = (playerBookingCount[x.player_id] || 0) + 1; });
    const secondBooking = Object.values(playerBookingCount).filter(c => c >= 2).length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const activeThisMonth = new Set(
      b.filter((x: any) => x.booking_date >= thirtyDaysAgo).map((x: any) => x.player_id)
    ).size;
    const funnel = [
      { stage: "Signups", count: totalSignups },
      { stage: "Profile Done", count: profileCompleted },
      { stage: "1st Booking", count: playersWithBooking },
      { stage: "2nd Booking", count: secondBooking },
      { stage: "Active (30d)", count: activeThisMonth },
    ];
    const coachIdsWithPkgs = new Set(pkgs.map((p: any) => p.coach_id));
    const coachesNoPkgs = cp.filter((c: any) => !coachIdsWithPkgs.has(c.user_id)).length;
    const avgPkgPrice = pkgs.length > 0 ? pkgs.reduce((s: number, p: any) => s + Number(p.price_per_session || 0), 0) / pkgs.length : 40;
    const estimatedLostGMV = coachesNoPkgs * avgPkgPrice * 4;
    const browsersNotBooking = profiles.filter((p: any) => {
      const hasBooking = b.some((bk: any) => bk.player_id === p.user_id);
      return !hasBooking;
    }).length;
    const incompleteProfiles = pp.filter((p: any) => !p.preferred_sport).length;
    const unverifiedReady = cp.filter((c: any) => !c.is_verified && c.bio).length;
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    const abandonedBookings = b.filter((x: any) => x.status === "pending" && x.created_at < oneDayAgo).length;
    return { funnel, coachesNoPkgs, estimatedLostGMV, browsersNotBooking, incompleteProfiles, unverifiedReady, abandonedBookings };
  }, [d]);

  // ─── SECTION 6: COMMUNITY & GAMIFICATION ────────────
  const community = useMemo(() => {
    const us = d.userStats || [];
    const ub = d.userBadges || [];
    const lb = d.leaderboard || [];
    const refs = d.referrals || [];
    const evts = d.events || [];
    const er = d.eventRegs || [];
    const totalXP = us.reduce((s: number, u: any) => s + Number(u.total_xp || 0), 0);
    const now = new Date();
    const thisMonthBadges = ub.filter((b: any) => {
      const d = new Date(b.earned_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const lbParticipants = lb.filter((l: any) => (l.total_xp || 0) > 0).length;
    const activeReferrals = refs.filter((r: any) => r.status !== "pending").length;
    const walletOutstanding = us.reduce((s: number, u: any) => s + Number(u.wallet_balance || 0), 0);
    const raffleTickets = us.reduce((s: number, u: any) => s + Number(u.raffle_tickets || 0), 0);
    const levelCounts: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0, legend: 0 };
    us.forEach((u: any) => { if (u.current_level && levelCounts[u.current_level] !== undefined) levelCounts[u.current_level]++; });
    const levelChart = Object.entries(levelCounts).map(([name, value]) => ({ name, value, fill: LEVEL_COLORS[name] || "#888" }));
    const totalEvents = evts.length;
    const totalEventRegs = er.length;
    const thisMonthEvents = evts.filter((e: any) => {
      const d = new Date(e.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const paidEventRev = er.reduce((s: number, r: any) => s + Number(r.amount_paid || 0), 0);
    const eventTypeCounts: Record<string, number> = {};
    evts.forEach((e: any) => { eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1; });
    const eventTypeChart = Object.entries(eventTypeCounts).map(([name, value]) => ({ name, value }));
    const avgParticipants = totalEvents > 0 ? totalEventRegs / totalEvents : 0;
    const refTotal = refs.length;
    const refPending = refs.filter((r: any) => r.status === "pending").length;
    const refSignedUp = refs.filter((r: any) => r.referred_id).length;
    const refCompleted = refs.filter((r: any) => r.booking_reward_paid).length;
    const refFunnel = [
      { stage: "Links Shared", count: refTotal },
      { stage: "Pending", count: refPending },
      { stage: "Signed Up", count: refSignedUp },
      { stage: "Booked", count: refCompleted },
    ];
    const refRevenue = (d.walletTx || []).filter((t: any) => t.type === "referral_reward")
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    return {
      totalXP, thisMonthBadges, lbParticipants, activeReferrals,
      walletOutstanding, raffleTickets, levelChart,
      totalEvents, totalEventRegs, thisMonthEvents, paidEventRev,
      eventTypeChart, avgParticipants, refFunnel, refRevenue,
    };
  }, [d]);

  // ─── SECTION 7: MARKETING & ACQUISITION ─────────────
  const marketing = useMemo(() => {
    const b = d.bookings || [];
    const profiles = d.profiles || [];
    const refs = d.referrals || [];
    const pv = d.pageViews || [];
    const walletTx = d.walletTx || [];
    const now = new Date();

    // Avg days signup → first booking
    const playerFirstBooking: Record<string, string> = {};
    b.forEach((x: any) => {
      if (!playerFirstBooking[x.player_id] || x.booking_date < playerFirstBooking[x.player_id]) {
        playerFirstBooking[x.player_id] = x.booking_date;
      }
    });
    let totalDays = 0, dayCount = 0;
    Object.entries(playerFirstBooking).forEach(([pid, bookDate]) => {
      const prof = profiles.find((p: any) => p.user_id === pid);
      if (prof) {
        const diff = (new Date(bookDate).getTime() - new Date(prof.created_at).getTime()) / 86400000;
        if (diff >= 0) { totalDays += diff; dayCount++; }
      }
    });
    const avgDaysToFirstBooking = dayCount > 0 ? totalDays / dayCount : 0;

    // Referral conversion
    const refConvRate = refs.length > 0 ? (refs.filter((r: any) => r.status === "completed").length / refs.length) * 100 : 0;

    // Top referral source
    const codeCounts: Record<string, number> = {};
    refs.forEach((r: any) => { codeCounts[r.referral_code] = (codeCounts[r.referral_code] || 0) + 1; });
    const topRefSource = Object.entries(codeCounts).sort((a, b) => b[1] - a[1])[0];

    // Coach profile views
    const coachViews = pv.filter((v: any) => v.page_type === "coach_profile");
    const coachViewCounts: Record<string, number> = {};
    coachViews.forEach((v: any) => { if (v.reference_id) coachViewCounts[v.reference_id] = (coachViewCounts[v.reference_id] || 0) + 1; });

    // Top 10 coaches by acquisition
    const coachAcquisition = Object.entries(coachViewCounts).map(([coachId, views]) => {
      const prof = profiles.find((p: any) => p.user_id === coachId);
      const coachBookings = b.filter((x: any) => x.coach_id === coachId && ["confirmed", "completed"].includes(x.status));
      const uniquePlayers = new Set(coachBookings.map((x: any) => x.player_id)).size;
      return {
        coachId, name: prof?.full_name || "Unknown", views,
        playersAcquired: uniquePlayers,
        convRate: views > 0 ? (uniquePlayers / views * 100) : 0,
        bookingsDriven: coachBookings.length,
      };
    }).sort((a, b) => b.views - a.views).slice(0, 10);

    // Referral ROI (last 6 months)
    const referralROI: { month: string; cost: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      const monthCredits = walletTx.filter((t: any) => t.type === "referral_reward" && t.created_at?.startsWith(key))
        .reduce((s: number, t: any) => s + Math.abs(Number(t.amount || 0)), 0);
      const referredIds = refs.filter((r: any) => r.status === "completed" && r.created_at?.startsWith(key))
        .map((r: any) => r.referred_id).filter(Boolean);
      const refGMV = b.filter((x: any) => referredIds.includes(x.player_id) && x.booking_date?.startsWith(key) && ["confirmed", "completed"].includes(x.status))
        .reduce((s: number, x: any) => s + Number(x.total_price || 0), 0);
      referralROI.push({ month: key.slice(5), cost: monthCredits, revenue: refGMV });
    }

    // Time to first booking trend (last 6 months)
    const ttfbTrend: { month: string; days: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      const monthProfiles = profiles.filter((p: any) => p.created_at?.startsWith(key));
      let sum = 0, cnt = 0;
      monthProfiles.forEach((p: any) => {
        const fb = playerFirstBooking[p.user_id];
        if (fb) {
          const diff = (new Date(fb).getTime() - new Date(p.created_at).getTime()) / 86400000;
          if (diff >= 0) { sum += diff; cnt++; }
        }
      });
      ttfbTrend.push({ month: key.slice(5), days: cnt > 0 ? sum / cnt : 0 });
    }

    return { avgDaysToFirstBooking, refConvRate, topRefSource, coachAcquisition, referralROI, ttfbTrend };
  }, [d]);

  // ─── SECTION 8: SPEND & UNIT ECONOMICS ──────────────
  const unitEcon = useMemo(() => {
    const spend = d.founderSpend || [];
    const b = d.bookings || [];
    const profiles = d.profiles || [];
    const us = d.userStats || [];
    const walletTx = d.walletTx || [];
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const monthlySpend = spend.filter((s: any) => s.month === thisMonthKey)
      .reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
    const newUsersThisMonth = profiles.filter((p: any) => p.created_at?.startsWith(thisMonthKey)).length;
    const cac = newUsersThisMonth > 0 ? monthlySpend / newUsersThisMonth : 0;

    const confirmed = b.filter((x: any) => ["confirmed", "completed"].includes(x.status));
    const avgBV = confirmed.length > 0 ? confirmed.reduce((s: number, x: any) => s + Number(x.total_price || 0), 0) / confirmed.length : 0;
    const playerBookings: Record<string, number> = {};
    confirmed.forEach((x: any) => { playerBookings[x.player_id] = (playerBookings[x.player_id] || 0) + 1; });
    const playerCount = Object.keys(playerBookings).length;
    const avgBookingsPerPlayer = playerCount > 0 ? Object.values(playerBookings).reduce((a, b) => a + b, 0) / playerCount : 0;
    const ltv = avgBV * avgBookingsPerPlayer * 0.85;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    const gmv = confirmed.reduce((s: number, x: any) => s + Number(x.total_price || 0), 0);
    const platformFees = confirmed.reduce((s: number, x: any) => s + Number(x.platform_fee || 0), 0);
    const grossMargin = gmv > 0 ? (platformFees / gmv) * 100 : 0;
    const revCoverage = monthlySpend > 0 ? (biz.thisMonthFees / monthlySpend) * 100 : 0;

    // Revenue vs Spend chart (12 months)
    const revVsSpend: { month: string; revenue: number; spend: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      const monthRev = confirmed.filter((x: any) => x.booking_date?.startsWith(key))
        .reduce((s: number, x: any) => s + Number(x.platform_fee || 0), 0);
      const monthSpend = spend.filter((s: any) => s.month === key)
        .reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
      revVsSpend.push({ month: key.slice(5), revenue: monthRev, spend: monthSpend });
    }

    // Wallet liability
    const walletLiability = us.reduce((s: number, u: any) => s + Number(u.wallet_balance || 0), 0);
    const creditsIssuedThisMonth = walletTx.filter((t: any) => t.created_at?.startsWith(thisMonthKey) && Number(t.amount) > 0)
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const creditsSpentThisMonth = walletTx.filter((t: any) => t.created_at?.startsWith(thisMonthKey) && Number(t.amount) < 0)
      .reduce((s: number, t: any) => s + Math.abs(Number(t.amount || 0)), 0);

    return { cac, ltv, ltvCacRatio, grossMargin, monthlyBurn: monthlySpend, revCoverage, revVsSpend, walletLiability, creditsIssuedThisMonth, creditsSpentThisMonth };
  }, [d, biz]);

  // ─── SECTION 9: GEOGRAPHIC EXPANSION ────────────────
  const geo = useMemo(() => {
    const pp = d.playerProfiles || [];
    const cp = d.coachProfiles || [];
    const b = d.bookings || [];
    const confirmed = b.filter((x: any) => ["confirmed", "completed"].includes(x.status));

    // City performance
    const cityMap: Record<string, { country: string; players: number; coaches: number; bookings: number; gmv: number }> = {};
    pp.forEach((p: any) => {
      const city = p.club_location;
      if (city) {
        if (!cityMap[city]) cityMap[city] = { country: "-", players: 0, coaches: 0, bookings: 0, gmv: 0 };
        cityMap[city].players++;
      }
    });
    cp.forEach((c: any) => {
      const city = c.location_city;
      if (city) {
        if (!cityMap[city]) cityMap[city] = { country: c.location_country || "-", players: 0, coaches: 0, bookings: 0, gmv: 0 };
        cityMap[city].coaches++;
        if (c.location_country) cityMap[city].country = c.location_country;
      }
    });

    const cityTable = Object.entries(cityMap)
      .sort((a, b) => (b[1].players + b[1].coaches) - (a[1].players + a[1].coaches))
      .slice(0, 20)
      .map(([city, data]) => {
        let status = "DEMAND ONLY";
        if (data.coaches >= 3 && data.players >= 10 && data.bookings >= 5) status = "ESTABLISHED";
        else if (data.coaches >= 1 && data.players >= 3) status = "GROWING";
        else if (data.coaches > 0 && data.bookings === 0) status = "SUPPLY ONLY";
        const statusColor = status === "ESTABLISHED" ? "text-green-400" : status === "GROWING" ? "text-blue-400" :
          status === "DEMAND ONLY" ? "text-red-400" : "text-amber-400";
        return { city, ...data, avgBV: data.bookings > 0 ? data.gmv / data.bookings : 0, status, statusColor };
      });

    // Expansion opportunities
    const demandOnly = Object.entries(cityMap)
      .filter(([_, data]) => data.players > 0 && data.coaches === 0)
      .sort((a, b) => b[1].players - a[1].players)
      .map(([city, data]) => ({ city, players: data.players, estValue: data.players * (biz.avgBooking || 40) * 2 }));

    // Country breakdown
    const countryMap: Record<string, { players: number; coaches: number; gmv: number }> = {};
    Object.entries(cityMap).forEach(([_, data]) => {
      const c = data.country || "Unknown";
      if (!countryMap[c]) countryMap[c] = { players: 0, coaches: 0, gmv: 0 };
      countryMap[c].players += data.players;
      countryMap[c].coaches += data.coaches;
      countryMap[c].gmv += data.gmv;
    });
    const countries = Object.entries(countryMap).sort((a, b) => b[1].players - a[1].players)
      .map(([country, data]) => ({ country, ...data }));

    return { cityTable, demandOnly, countries };
  }, [d, biz]);

  // ─── SECTION 10: COHORT RETENTION ───────────────────
  const cohort = useMemo(() => {
    const profiles = d.profiles || [];
    const b = d.bookings || [];
    const now = new Date();

    // Build cohorts (last 12 months)
    const cohorts: { month: string; userIds: string[] }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      const users = profiles.filter((p: any) => p.created_at?.startsWith(key)).map((p: any) => p.user_id);
      cohorts.push({ month: key, userIds: users });
    }

    // For each cohort, calculate retention for M0-M6
    const retentionTable = cohorts.map(c => {
      const row: { month: string; size: number; retention: (number | null)[] } = { month: c.month, size: c.userIds.length, retention: [] };
      for (let m = 0; m <= 6; m++) {
        const targetDate = new Date(parseInt(c.month.split("-")[0]), parseInt(c.month.split("-")[1]) - 1 + m, 1);
        const targetKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
        if (targetDate > now) { row.retention.push(null); continue; }
        if (c.userIds.length === 0) { row.retention.push(0); continue; }
        const activeInMonth = c.userIds.filter(uid =>
          b.some((bk: any) => bk.player_id === uid && bk.booking_date?.startsWith(targetKey))
        ).length;
        row.retention.push((activeInMonth / c.userIds.length) * 100);
      }
      return row;
    }).reverse(); // newest first

    // Avg M1 and M3
    const m1Values = retentionTable.map(r => r.retention[1]).filter((v): v is number => v !== null && v !== undefined);
    const m3Values = retentionTable.map(r => r.retention[3]).filter((v): v is number => v !== null && v !== undefined);
    const avgM1 = m1Values.length > 0 ? m1Values.reduce((a, b) => a + b, 0) / m1Values.length : 0;
    const avgM3 = m3Values.length > 0 ? m3Values.reduce((a, b) => a + b, 0) / m3Values.length : 0;

    // Revenue cohort
    const revTable = cohorts.map(c => {
      const row: { month: string; size: number; revenue: (number | null)[] } = { month: c.month, size: c.userIds.length, revenue: [] };
      for (let m = 0; m <= 6; m++) {
        const targetDate = new Date(parseInt(c.month.split("-")[0]), parseInt(c.month.split("-")[1]) - 1 + m, 1);
        const targetKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
        if (targetDate > now) { row.revenue.push(null); continue; }
        if (c.userIds.length === 0) { row.revenue.push(0); continue; }
        const rev = b.filter((bk: any) => c.userIds.includes(bk.player_id) && bk.booking_date?.startsWith(targetKey) && ["confirmed", "completed"].includes(bk.status))
          .reduce((s: number, bk: any) => s + Number(bk.total_price || 0), 0);
        row.revenue.push(c.userIds.length > 0 ? rev / c.userIds.length : 0);
      }
      return row;
    }).reverse();

    return { retentionTable, revTable, avgM1, avgM3 };
  }, [d]);

  // ─── SECTION 11: COMPETITIVE MOAT ──────────────────
  const moat = useMemo(() => {
    const pp = d.playerProfiles || [];
    const hd = d.healthConns || [];
    const tb = d.trainingBlocks || [];
    const us = d.userStats || [];
    const pv = d.progressVideos || [];
    const rev = d.reviews || [];
    const cp = d.coachProfiles || [];

    // Unique data points
    const fields = ["date_of_birth", "dominant_hand", "fitness_level", "preferred_sport", "playtomic_level", "club_name", "club_location", "nationality"];
    let dataPoints = 0;
    pp.forEach((p: any) => { fields.forEach(f => { if (p[f] != null) dataPoints++; }); });

    // Shot data profiles
    const shotProfiles = pp.filter((p: any) => p.forehand_pct != null && p.forehand_pct !== 50).length;

    // Health data points
    const healthDataPoints = (d.healthConns || []).filter((h: any) => h.is_connected).length;

    // Network density by city
    const cityUsers: Record<string, { players: number; coaches: number }> = {};
    pp.forEach((p: any) => {
      if (p.club_location) {
        if (!cityUsers[p.club_location]) cityUsers[p.club_location] = { players: 0, coaches: 0 };
        cityUsers[p.club_location].players++;
      }
    });
    cp.forEach((c: any) => {
      if (c.location_city) {
        if (!cityUsers[c.location_city]) cityUsers[c.location_city] = { players: 0, coaches: 0 };
        cityUsers[c.location_city].coaches++;
      }
    });
    const networkDensity = Object.entries(cityUsers)
      .filter(([_, d]) => (d.players + d.coaches) >= 3)
      .map(([city, data]) => ({
        city, players: data.players, coaches: data.coaches,
        ratio: data.coaches > 0 ? data.players / data.coaches : Infinity,
        status: data.coaches === 0 ? "NO COACHES" :
          (data.players / data.coaches > 5) ? "OVER-DEMANDED" :
            (data.players / data.coaches < 2) ? "UNDER-UTILISED" : "BALANCED",
      }))
      .sort((a, b) => b.ratio - a.ratio);

    // Content library
    const totalBlocks = tb.length;
    const publicBlocks = tb.filter((t: any) => t.is_public || t.is_for_sale).length;
    const totalMinutes = us.reduce((s: number, u: any) => s + Number(u.total_minutes || 0), 0);
    const totalVideos = pv.length;
    const totalReviews = rev.length;

    return { dataPoints, shotProfiles, healthDataPoints, networkDensity, totalBlocks, publicBlocks, totalMinutes, totalVideos, totalReviews };
  }, [d]);

  // ─── SECTION 12: ALERTS & ANOMALIES ─────────────────
  const alerts = useMemo(() => {
    const b = d.bookings || [];
    const profiles = d.profiles || [];
    const cp = d.coachProfiles || [];
    const refs = d.referrals || [];
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
    const lastWeekStart = new Date(now.getTime() - 14 * 86400000).toISOString();

    const thisWeekBookings = b.filter((x: any) => x.created_at >= thisWeekStart).length;
    const lastWeekBookings = b.filter((x: any) => x.created_at >= lastWeekStart && x.created_at < thisWeekStart).length;
    const thisWeekSignups = profiles.filter((p: any) => p.created_at >= thisWeekStart).length;
    const lastWeekSignups = profiles.filter((p: any) => p.created_at >= lastWeekStart && p.created_at < thisWeekStart).length;
    const thisWeekCancelled = b.filter((x: any) => x.status === "cancelled" && x.cancelled_at >= thisWeekStart).length;
    const thisWeekTotal = b.filter((x: any) => x.created_at >= thisWeekStart).length;
    const cancelRate = thisWeekTotal > 0 ? (thisWeekCancelled / thisWeekTotal) * 100 : 0;
    const thisWeekRefSignups = refs.filter((r: any) => r.created_at >= thisWeekStart && r.referred_id).length;
    const lastWeekRefAvg = refs.filter((r: any) => r.created_at >= lastWeekStart && r.created_at < thisWeekStart && r.referred_id).length;

    const redAlerts: string[] = [];
    const greenSignals: string[] = [];

    if (lastWeekBookings > 0 && thisWeekBookings < lastWeekBookings * 0.8) {
      redAlerts.push(`Bookings down ${Math.round((1 - thisWeekBookings / lastWeekBookings) * 100)}% vs last week`);
    }
    if (lastWeekSignups > 0 && thisWeekSignups < lastWeekSignups * 0.7) {
      redAlerts.push(`New signups down ${Math.round((1 - thisWeekSignups / lastWeekSignups) * 100)}% vs last week`);
    }
    if (cancelRate > 15) redAlerts.push(`Cancellation rate elevated: ${cancelRate.toFixed(0)}%`);

    // Green signals
    const allCountries = new Set(b.map((x: any) => {
      const c = cp.find((c: any) => c.user_id === x.coach_id);
      return c?.location_country;
    }).filter(Boolean));
    // We can't easily detect "new country" without historical data, skip for now

    if (biz.mrr >= 1000 && biz.lastMonthGMV < 1000) greenSignals.push("MRR crossed €1,000! 🎉");
    if (biz.mrr >= 5000 && biz.lastMonthGMV < 5000) greenSignals.push("MRR crossed €5,000! 🎉");
    if (lastWeekRefAvg > 0 && thisWeekRefSignups > lastWeekRefAvg * 2) {
      greenSignals.push(`Referral signups up ${Math.round((thisWeekRefSignups / lastWeekRefAvg - 1) * 100)}% — something went viral`);
    }

    return { redAlerts, greenSignals };
  }, [d, biz]);

  // ─── SECTION 13: INVESTOR READINESS SCORE ───────────
  const investorScore = useMemo(() => {
    const b = d.bookings || [];
    const profiles = d.profiles || [];
    const refs = d.referrals || [];
    const cp = d.coachProfiles || [];
    const now = new Date();

    // 1. GMV Growth MoM (20 pts)
    const gmvGrowth = biz.lastMonthGMV > 0 ? (biz.mrr / biz.lastMonthGMV - 1) : 0;
    const gmvScore = Math.min(20, Math.max(0, gmvGrowth * 100));

    // 2. D30 Retention (20 pts)
    const playerFirstBooking: Record<string, string> = {};
    b.forEach((x: any) => {
      if (!playerFirstBooking[x.player_id] || x.booking_date < playerFirstBooking[x.player_id]) {
        playerFirstBooking[x.player_id] = x.booking_date;
      }
    });
    let d30Total = 0, d30Retained = 0;
    Object.entries(playerFirstBooking).forEach(([pid, firstDate]) => {
      d30Total++;
      const thirtyLater = new Date(new Date(firstDate).getTime() + 30 * 86400000);
      if (thirtyLater > now) return;
      const hasSecond = b.some((x: any) => x.player_id === pid && x.booking_date > firstDate && x.booking_date <= thirtyLater.toISOString().split("T")[0]);
      if (hasSecond) d30Retained++;
    });
    const d30Pct = d30Total > 0 ? (d30Retained / d30Total) * 100 : 0;
    const retentionScore = Math.min(20, (d30Pct / 30) * 20);

    // 3. LTV/CAC (20 pts)
    const ltvCacScore = unitEcon.ltvCacRatio >= 5 ? 20 : unitEcon.ltvCacRatio >= 3 ? 10 : unitEcon.ltvCacRatio >= 1 ? 5 : 0;

    // 4. Coach supply growth (15 pts)
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const coachRoles = (d.userRoles || []).filter((r: any) => r.role === "coach");
    const coachProfiles2 = d.profiles || [];
    const newCoachesThis = coachProfiles2.filter((p: any) => {
      const isCoach = coachRoles.some((r: any) => r.user_id === p.user_id);
      return isCoach && p.created_at?.startsWith(thisMonthKey);
    }).length;
    const newCoachesLast = coachProfiles2.filter((p: any) => {
      const isCoach = coachRoles.some((r: any) => r.user_id === p.user_id);
      return isCoach && p.created_at?.startsWith(lastMonthKey);
    }).length;
    const coachGrowth = newCoachesLast > 0 ? ((newCoachesThis - newCoachesLast) / newCoachesLast) * 100 : 0;
    const supplyScore = Math.min(15, Math.max(0, (coachGrowth / 10) * 15));

    // 5. Viral coefficient (15 pts)
    const totalUsers = profiles.length;
    const completedRefs = refs.filter((r: any) => r.status === "completed").length;
    const viralPct = totalUsers > 0 ? (completedRefs / totalUsers) * 100 : 0;
    const viralScore = Math.min(15, (viralPct / 5) * 15);

    // 6. Revenue per user trend (10 pts)
    const revPerUserScore = biz.lastMonthGMV > 0 && biz.mrr > biz.lastMonthGMV ? 10 : 0;

    const total = Math.round(gmvScore + retentionScore + ltvCacScore + supplyScore + viralScore + revPerUserScore);
    const components = [
      { name: "GMV Growth MoM", earned: Math.round(gmvScore), max: 20 },
      { name: "D30 Retention", earned: Math.round(retentionScore), max: 20 },
      { name: "LTV/CAC Ratio", earned: ltvCacScore, max: 20 },
      { name: "Coach Supply Growth", earned: Math.round(supplyScore), max: 15 },
      { name: "Viral Coefficient", earned: Math.round(viralScore), max: 15 },
      { name: "Rev/User Trend", earned: revPerUserScore, max: 10 },
    ];

    let interpretation = "Keep building — focus on retention and first bookings";
    if (total >= 80) interpretation = "Series A territory — start booking VC meetings";
    else if (total >= 60) interpretation = "Investor-ready — prepare your pitch deck";
    else if (total >= 40) interpretation = "Strong foundation — ready for angel conversations";

    return { total, components, interpretation, d30Pct };
  }, [d, biz, unitEcon]);

  // ─── ACTIONS ────────────────────────────────────────
  const handleExportFull = () => {
    const rows = [
      { metric: "GMV", value: biz.gmv, date: new Date().toISOString() },
      { metric: "MRR", value: biz.mrr, date: new Date().toISOString() },
      { metric: "ARR", value: biz.arr, date: new Date().toISOString() },
      { metric: "Platform Revenue", value: biz.platformRev, date: new Date().toISOString() },
      { metric: "Total Users", value: (d.profiles || []).length, date: new Date().toISOString() },
      { metric: "Total Coaches", value: coach.totalCoaches, date: new Date().toISOString() },
      { metric: "Take Rate %", value: biz.takeRate.toFixed(2), date: new Date().toISOString() },
      { metric: "Viral Coefficient %", value: biz.viralCoeff.toFixed(2), date: new Date().toISOString() },
      { metric: "Avg Booking Value", value: biz.avgBooking.toFixed(2), date: new Date().toISOString() },
      { metric: "Cancellation Rate %", value: cust.cancelRate.toFixed(2), date: new Date().toISOString() },
      { metric: "CAC", value: unitEcon.cac.toFixed(2), date: new Date().toISOString() },
      { metric: "LTV", value: unitEcon.ltv.toFixed(2), date: new Date().toISOString() },
      { metric: "Investor Score", value: investorScore.total, date: new Date().toISOString() },
    ];
    downloadCSV(rows, `founders-report-${new Date().toISOString().split("T")[0]}`);
    toast("Report downloaded");
  };

  const handleFindExpansion = () => {
    setExpansionCities(geo.demandOnly);
    setExpansionModal(true);
  };

  const handleNudgeAllAtRisk = async () => {
    const msg = "Your profile is looking great! Need help getting your first booking? Reply to this message and we'll feature you on the homepage.";
    const inserts = coach.atRiskCoaches.map((c: any) => ({
      user_id: c.userId, title: "Let's get you booked! 🎾", body: msg, link: "/coach",
    }));
    if (inserts.length === 0) { toast("No at-risk coaches"); return; }
    const { error } = await supabase.from("notifications").insert(inserts);
    if (error) toast("Failed to send");
    else toast(`Nudge sent to ${inserts.length} coaches`);
  };

  const handleSendNudge = async (userId: string) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId, title: "Let's get you booked! 🎾",
      body: "Your profile is looking great! Need help getting your first booking? Reply to this message and we'll feature you on the homepage.",
      link: "/coach",
    });
    if (error) toast("Failed"); else toast("Nudge sent");
  };

  const handleAddSpend = async () => {
    if (!newSpend.month || !newSpend.amount) { toast("Fill in month and amount"); return; }
    const { error } = await supabase.from("founder_spend").insert({
      month: newSpend.month, category: newSpend.category,
      amount: parseFloat(newSpend.amount), notes: newSpend.notes || null,
      created_by: user?.id,
    });
    if (error) { toast("Failed to save"); return; }
    setNewSpend({ month: "", category: "marketing", amount: "", notes: "" });
    setShowSpendForm(false);
    fetchAll();
    toast("Expense added");
  };

  const handleDeleteSpend = async (id: string) => {
    await supabase.from("founder_spend").delete().eq("id", id);
    fetchAll();
    toast("Deleted");
  };

  const handleShareDashboard = async () => {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("founder_share_tokens").insert({
      token, created_by: user?.id, expires_at: expiresAt,
    });
    if (error) { toast("Failed to create link"); return; }
    const url = `${window.location.origin}/founders?token=${token}`;
    navigator.clipboard.writeText(url);
    toast("Share link copied to clipboard (valid 24h)");
  };

  const investorKPIs = useMemo(() => [
    { label: "GMV", value: `€${biz.gmv.toLocaleString()}` },
    { label: "MRR", value: `€${biz.mrr.toLocaleString()}` },
    { label: "ARR", value: `€${biz.arr.toLocaleString()}` },
    { label: "Users", value: (d.profiles || []).length },
    { label: "Coaches", value: coach.totalCoaches },
    { label: "Take Rate", value: `${biz.takeRate.toFixed(1)}%` },
    { label: "Viral Coefficient", value: `${biz.viralCoeff.toFixed(1)}%` },
    { label: "D30 Retention", value: `${investorScore.d30Pct.toFixed(1)}%` },
    { label: "Avg Booking Value", value: `€${biz.avgBooking.toFixed(0)}` },
    { label: "Top City", value: cust.topCities[0]?.city || "-" },
    { label: "Top Coach", value: coach.topCoaches[0]?.name || "-" },
    { label: "Platform Revenue", value: `€${biz.platformRev.toLocaleString()}` },
  ], [biz, coach, cust, investorScore, d]);

  const copyInvestorSnapshot = () => {
    const text = investorKPIs.map(k => `${k.label}: ${k.value}`).join("\n");
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

  // Auth guard — share token or admin
  if (checkingToken || authLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  if (!user && !tokenValid) {
    return <Navigate to="/login" replace />;
  }

  if (user && role !== "admin" && !tokenValid) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PortalLayout>
    );
  }

  const maxFunnel = lost.funnel[0]?.count || 1;

  const retentionColor = (pct: number) => {
    const r = Math.round(239 - (239 - 16) * (pct / 100));
    const g = Math.round(68 + (185 - 68) * (pct / 100));
    const b = Math.round(68 + (129 - 68) * (pct / 100));
    return `rgb(${r},${g},${b})`;
  };

  // Calculate share token expiry for banner
  const getTokenExpiryText = () => {
    if (!shareToken || !tokenValid) return "";
    return "less than 24 hours";
  };

  return (
    <PortalLayout>
      <div className="flex-1 overflow-y-auto h-screen">
      {/* Read-only banner */}
      {isReadOnly && (
        <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 font-body">
            👁 Read-only shared view — expires in {getTokenExpiryText()}
          </p>
        </div>
      )}
      {/* Sticky Header */}
      <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-md border-b border-border -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground">FOUNDERS INTELLIGENCE</h1>
          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground font-body">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button onClick={fetchAll} variant="outline" size="sm">
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} /> REFRESH ALL
        </Button>
      </div>

      {/* ══════ SECTION 1 — BUSINESS HEALTH ══════ */}
      <Section title="BUSINESS HEALTH" borderColor="#22c55e" id="business"
        onExport={() => downloadCSV([
          { metric: "GMV", value: biz.gmv }, { metric: "MRR", value: biz.mrr },
          { metric: "ARR", value: biz.arr }, { metric: "Platform Revenue", value: biz.platformRev },
          { metric: "Avg Booking", value: biz.avgBooking }, { metric: "Rev Per User", value: biz.revPerUser },
          { metric: "Take Rate", value: biz.takeRate }, { metric: "Viral Coefficient", value: biz.viralCoeff },
        ], "business-health")}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="GMV All Time" value={biz.gmv} prefix="€" />
          <MetricCard label="MRR" value={biz.mrr} prefix="€" />
          <MetricCard label="ARR" value={biz.arr} prefix="€" />
          <MetricCard label="Platform Revenue" value={biz.platformRev} prefix="€" />
          <MetricCard label="Avg Booking Value" value={biz.avgBooking} prefix="€" decimals={2} />
          <MetricCard label="Revenue Per User" value={biz.revPerUser} prefix="€" decimals={2} />
          <MetricCard label="Take Rate" value={biz.takeRate} suffix="%" decimals={1} />
          <MetricCard label="Viral Coefficient" value={biz.viralCoeff} suffix="%" decimals={1} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Revenue Trend (12mo)</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={biz.revChart}>
                  <XAxis dataKey="month" tick={TICK_STYLE} />
                  <YAxis tick={TICK_STYLE} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Bar dataKey="gmv" fill="hsl(0,90%,45%)" radius={[4, 4, 0, 0]} name="GMV" />
                  <Line type="monotone" dataKey="fees" stroke="hsl(210,80%,55%)" name="Platform Fees" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Growth Rate (12mo)</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={biz.growthChart}>
                  <XAxis dataKey="month" tick={TICK_STYLE} />
                  <YAxis tick={TICK_STYLE} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Line type="monotone" dataKey="players" stroke="hsl(170,70%,45%)" strokeWidth={2} name="Players" />
                  <Line type="monotone" dataKey="coaches" stroke="hsl(270,70%,55%)" strokeWidth={2} name="Coaches" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ══════ SECTION 2 — CUSTOMER INTELLIGENCE ══════ */}
      <Section title="CUSTOMER INTELLIGENCE" borderColor="#3b82f6" id="customer"
        onExport={() => downloadCSV(cust.topCities, "customer-cities")}
      >
        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Age Distribution</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={cust.ageChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {cust.ageChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Sport Preference</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={cust.sportChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {cust.sportChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Fitness Level</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cust.fitnessChart} layout="vertical">
                  <XAxis type="number" tick={TICK_STYLE} />
                  <YAxis dataKey="name" type="category" tick={TICK_STYLE} width={90} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Bar dataKey="value" fill="hsl(210,80%,55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Peak Booking Day" value={0} prefix={cust.peakDay} />
          <MetricCard label="Peak Booking Hour" value={cust.peakHour} suffix=":00" />
          <MetricCard label="Avg Lead Time" value={cust.avgLeadTime} suffix=" days" decimals={1} />
          <MetricCard label="Cancellation Rate" value={cust.cancelRate} suffix="%" decimals={1} highlight={cust.cancelRate > 15} />
        </div>
        {cust.topCities.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-body">Top Cities</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-body">
                  <thead><tr className="text-muted-foreground border-b border-border">
                    <th className="text-left p-2">#</th><th className="text-left p-2">City</th>
                    <th className="text-right p-2">Players</th><th className="text-right p-2">Coaches</th>
                    <th className="text-right p-2">Bookings</th><th className="text-right p-2">Avg Value</th>
                  </tr></thead>
                  <tbody>
                    {cust.topCities.map((c: any) => (
                      <tr key={c.city} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-2 text-muted-foreground">{c.rank}</td>
                        <td className="p-2 text-foreground">{c.city}</td>
                        <td className="p-2 text-right">{c.players}</td>
                        <td className="p-2 text-right">{c.coaches}</td>
                        <td className="p-2 text-right">{c.bookings}</td>
                        <td className="p-2 text-right">€{c.avgBookingValue.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Training Frequency</CardTitle></CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cust.freqChart} layout="vertical">
                <XAxis type="number" tick={TICK_STYLE} />
                <YAxis dataKey="name" type="category" tick={TICK_STYLE} width={100} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="value" fill="hsl(170,70%,45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Section>

      {/* ══════ SECTION 3 — COACH INTELLIGENCE ══════ */}
      <Section title="COACH INTELLIGENCE" borderColor="#a855f7" id="coach"
        onExport={() => downloadCSV(coach.topCoaches, "coach-intelligence")}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Total Coaches" value={coach.totalCoaches} />
          <MetricCard label="Verified" value={coach.verified} suffix={` (${coach.verifiedPct.toFixed(0)}%)`} />
          <MetricCard label="0 Bookings (At-Risk)" value={coach.zeroBookingCoaches} highlight />
          <MetricCard label="Avg Packages/Coach" value={coach.avgPkgs} decimals={1} />
          <MetricCard label="Avg Session Price" value={coach.avgPrice} prefix="€" decimals={0} />
          <MetricCard label="Utilisation" value={0} suffix="%" />
        </div>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body">Top 10 Coaches by Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead><tr className="text-muted-foreground border-b border-border">
                  <th className="text-left p-2">#</th><th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Location</th><th className="text-right p-2">Sessions</th>
                  <th className="text-right p-2">Revenue</th><th className="text-right p-2">Rating</th>
                  <th className="text-center p-2">Badge</th><th className="text-center p-2">Verified</th>
                </tr></thead>
                <tbody>
                  {coach.topCoaches.map((c: any, i: number) => (
                    <tr key={c.userId} className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer"
                      onClick={() => navigate(`/admin/users?role=coach`)}>
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 text-foreground font-medium">{c.name}</td>
                      <td className="p-2">{c.location}</td>
                      <td className="p-2 text-right">{c.sessions}</td>
                      <td className="p-2 text-right font-medium">€{c.revenue.toLocaleString()}</td>
                      <td className="p-2 text-right">{c.avgRating}</td>
                      <td className="p-2 text-center uppercase text-[9px]">{c.badge}</td>
                      <td className="p-2 text-center">{c.verified ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {coach.atRiskCoaches.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-body flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> At-Risk Coaches ({coach.atRiskCoaches.length})
            </CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {coach.atRiskCoaches.slice(0, 10).map((c: any) => (
                  <div key={c.userId} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display">
                        {c.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.location || "No location"} • {c.pkgCount} packages</p>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <Button size="sm" variant="outline" onClick={() => handleSendNudge(c.userId)}>
                        <Send className="w-3 h-3 mr-1" /> NUDGE
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Badge Distribution</CardTitle></CardHeader>
            <CardContent className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coach.badgeChart} layout="vertical">
                  <XAxis type="number" tick={TICK_STYLE} />
                  <YAxis dataKey="name" type="category" tick={TICK_STYLE} width={60} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Bar dataKey="value" fill="hsl(270,70%,55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Marketplace Stats</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><p className="text-[10px] text-muted-foreground uppercase">Published</p><p className="font-display text-xl">{coach.published}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Sold</p><p className="font-display text-xl">{coach.sold}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">GMV</p><p className="font-display text-xl">€{coach.marketplaceGMV.toLocaleString()}</p></div>
              </div>
              {coach.topPrograms.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Top Programs</p>
                  {coach.topPrograms.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs p-1.5 rounded bg-secondary/30">
                      <span className="text-foreground truncate">{p.name}</span>
                      <span className="text-muted-foreground">{p.sales} sales • €{p.revenue}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ══════ SECTION 4 — PRODUCT & EQUIPMENT ══════ */}
      <Section title="PRODUCT & EQUIPMENT INSIGHTS" borderColor="#f59e0b" id="equipment"
        onExport={() => downloadCSV(equip.brandChart, "equipment-brands")}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-body">Top Racket Brands</CardTitle>
              <p className="text-[10px] text-muted-foreground">Use this for brand partnership negotiations</p>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equip.brandChart} layout="vertical">
                  <XAxis type="number" tick={TICK_STYLE} />
                  <YAxis dataKey="name" type="category" tick={TICK_STYLE} width={80} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Bar dataKey="value" fill="hsl(45,90%,55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Racket Type Distribution</CardTitle></CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={equip.typeChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {equip.typeChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Dominant Hand Split</p>
            <p className="font-display text-lg">Left: {equip.leftHand} ({equip.leftHand + equip.rightHand > 0 ? ((equip.leftHand / (equip.leftHand + equip.rightHand)) * 100).toFixed(0) : 0}%) • Right: {equip.rightHand}</p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Top String Brands</p>
            <div className="space-y-0.5">
              {equip.topStrings.map(([name, count]: any) => (
                <p key={name} className="text-xs text-foreground">{name}: {count}</p>
              ))}
              {equip.topStrings.length === 0 && <p className="text-xs text-muted-foreground">No data</p>}
            </div>
          </CardContent></Card>
        </div>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Training Pattern (Module Categories)</CardTitle></CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equip.moduleChart} layout="vertical">
                <XAxis type="number" tick={TICK_STYLE} />
                <YAxis dataKey="name" type="category" tick={TICK_STYLE} width={90} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="value" fill="hsl(0,90%,45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-2">
          <CardTitle className="text-sm font-body">Health Device Adoption</CardTitle>
          <p className="text-[10px] text-muted-foreground">{equip.healthPct.toFixed(1)}% of active players have a device connected</p>
        </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equip.healthChart}>
                <XAxis dataKey="name" tick={TICK_STYLE} />
                <YAxis tick={TICK_STYLE} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="value" fill="hsl(170,70%,45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Section>

      {/* ══════ SECTION 5 — LOST OPPORTUNITIES ══════ */}
      <Section title="LOST OPPORTUNITIES" borderColor="#ef4444" id="lost"
        onExport={() => downloadCSV(lost.funnel, "lost-opportunities")}
      >
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body">Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lost.funnel.map((f: any, i: number) => {
                const width = maxFunnel > 0 ? (f.count / maxFunnel) * 100 : 0;
                const prevCount = i > 0 ? lost.funnel[i - 1].count : f.count;
                const convRate = prevCount > 0 ? ((f.count / prevCount) * 100).toFixed(1) : "100";
                return (
                  <div key={f.stage}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{f.stage}</span>
                      <span className="text-muted-foreground">{f.count} {i > 0 && `(${convRate}%)`}</span>
                    </div>
                    <div className="h-6 bg-secondary/30 rounded overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded"
                        style={{ background: `linear-gradient(90deg, hsl(45,90%,55%) 0%, hsl(0,80%,50%) 100%)`, opacity: 1 - i * 0.15 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body flex items-center gap-2">
            <Target className="w-4 h-4 text-destructive" /> WHERE WE'RE LOSING MONEY
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground font-medium">{lost.coachesNoPkgs} coaches have no packages set</p>
                <p className="text-[10px] text-muted-foreground">Estimated lost GMV: €{lost.estimatedLostGMV.toLocaleString()}/mo</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-foreground font-medium">{lost.browsersNotBooking} players are browsing but not booking</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-foreground font-medium">{lost.incompleteProfiles} players have incomplete profiles — lower search visibility</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground font-medium">{lost.unverifiedReady} coaches ready to verify — pending your action</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/admin")}>GO TO VERIFICATION →</Button>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-foreground font-medium">{lost.abandonedBookings} bookings started but payment not completed</p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ══════ SECTION 6 — COMMUNITY & GAMIFICATION ══════ */}
      <Section title="COMMUNITY & GAMIFICATION HEALTH" borderColor="#14b8a6" id="community"
        onExport={() => downloadCSV(community.levelChart, "community-levels")}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Total XP Earned" value={community.totalXP} />
          <MetricCard label="Badges This Month" value={community.thisMonthBadges} />
          <MetricCard label="Leaderboard Active" value={community.lbParticipants} />
          <MetricCard label="Active Referrals" value={community.activeReferrals} />
          <MetricCard label="Wallet Outstanding" value={community.walletOutstanding} prefix="€" />
          <MetricCard label="Raffle Tickets" value={community.raffleTickets} />
        </div>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Level Distribution</CardTitle></CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={community.levelChart} layout="vertical">
                <XAxis type="number" tick={TICK_STYLE} />
                <YAxis dataKey="name" type="category" tick={TICK_STYLE} width={70} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {community.levelChart.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Total Events" value={community.totalEvents} />
          <MetricCard label="Total Registrations" value={community.totalEventRegs} />
          <MetricCard label="Events This Month" value={community.thisMonthEvents} />
          <MetricCard label="Event Revenue" value={community.paidEventRev} prefix="€" />
          <MetricCard label="Avg Participants" value={community.avgParticipants} decimals={1} />
        </div>
        {community.eventTypeChart.length > 0 && (
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Event Types</CardTitle></CardHeader>
            <CardContent className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={community.eventTypeChart}>
                  <XAxis dataKey="name" tick={TICK_STYLE} />
                  <YAxis tick={TICK_STYLE} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Bar dataKey="value" fill="hsl(170,70%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body">Referral Performance</CardTitle>
            <p className="text-[10px] text-muted-foreground">Total referral revenue: €{community.refRevenue.toLocaleString()}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {community.refFunnel.map((f: any, i: number) => (
                <div key={f.stage} className="text-center p-3 rounded-lg bg-secondary/30">
                  <p className="font-display text-xl text-foreground">{f.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{f.stage}</p>
                  {i < community.refFunnel.length - 1 && i > 0 && community.refFunnel[i - 1].count > 0 && (
                    <p className="text-[9px] text-primary mt-1">{((f.count / community.refFunnel[0].count) * 100).toFixed(0)}%</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ══════ SECTION 7 — MARKETING & ACQUISITION ══════ */}
      <Section title="MARKETING & ACQUISITION" borderColor="#10B981" id="marketing"
        onExport={() => downloadCSV(marketing.coachAcquisition, "marketing-acquisition")}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Avg Days to First Booking" value={marketing.avgDaysToFirstBooking} decimals={1} suffix=" days" />
          <MetricCard label="Referral Conversion" value={marketing.refConvRate} suffix="%" decimals={1} />
          <Card><CardContent className="p-4">
            <p className="text-[10px] font-body uppercase tracking-wider text-muted-foreground mb-1">Top Referral Source</p>
            <p className="font-display text-lg text-foreground truncate">{marketing.topRefSource ? `${marketing.topRefSource[0]} (${marketing.topRefSource[1]})` : "—"}</p>
          </CardContent></Card>
          <MetricCard label="Coach Profile Views" value={(d.pageViews || []).filter((v: any) => v.page_type === "coach_profile").length} />
        </div>

        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Referral ROI (6mo)</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketing.referralROI}>
                <XAxis dataKey="month" tick={TICK_STYLE} />
                <YAxis tick={TICK_STYLE} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="cost" fill="hsl(0,80%,50%)" name="Cost (credits)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="hsl(170,70%,45%)" name="Revenue (GMV)" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {marketing.coachAcquisition.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-body">Top 10 Coaches by Player Acquisition</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-body">
                  <thead><tr className="text-muted-foreground border-b border-border">
                    <th className="text-left p-2">Coach</th><th className="text-right p-2">Views</th>
                    <th className="text-right p-2">Players</th><th className="text-right p-2">Conv %</th>
                    <th className="text-right p-2">Bookings</th>
                  </tr></thead>
                  <tbody>
                    {marketing.coachAcquisition.map((c: any) => (
                      <tr key={c.coachId} className="border-b border-border/50">
                        <td className="p-2 text-foreground">{c.name}</td>
                        <td className="p-2 text-right">{c.views}</td>
                        <td className="p-2 text-right">{c.playersAcquired}</td>
                        <td className="p-2 text-right">{c.convRate.toFixed(1)}%</td>
                        <td className="p-2 text-right">{c.bookingsDriven}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card><CardHeader className="pb-2">
          <CardTitle className="text-sm font-body">Time to First Booking Trend</CardTitle>
          <p className="text-[10px] text-muted-foreground">Target: &lt;7 days</p>
        </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marketing.ttfbTrend}>
                <XAxis dataKey="month" tick={TICK_STYLE} />
                <YAxis tick={TICK_STYLE} />
                <Tooltip contentStyle={TT_STYLE} />
                <Line type="monotone" dataKey="days" stroke="hsl(170,70%,45%)" strokeWidth={2} name="Avg Days" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Section>

      {/* ══════ SECTION 8 — SPEND & UNIT ECONOMICS ══════ */}
      <Section title="SPEND & UNIT ECONOMICS" borderColor="#F59E0B" id="spend"
        onExport={() => downloadCSV(spendRows.map((s: any) => ({ month: s.month, category: s.category, amount: s.amount, notes: s.notes })), "spend")}
      >
        {/* Spend Input Table */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-body">Expense Tracker</CardTitle>
            {!isReadOnly && (
              <Button size="sm" variant="outline" onClick={() => setShowSpendForm(!showSpendForm)}>
                <Plus className="w-3 h-3 mr-1" /> ADD EXPENSE
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {showSpendForm && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-lg bg-secondary/20">
                <Input placeholder="YYYY-MM" value={newSpend.month} onChange={e => setNewSpend({ ...newSpend, month: e.target.value })} className="w-28 h-8 text-xs" />
                <Select value={newSpend.category} onValueChange={v => setNewSpend({ ...newSpend, category: v })}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["marketing", "development", "legal", "server", "events", "travel", "tools", "other"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="€ Amount" value={newSpend.amount} onChange={e => setNewSpend({ ...newSpend, amount: e.target.value })} className="w-24 h-8 text-xs" />
                <Input placeholder="Notes" value={newSpend.notes} onChange={e => setNewSpend({ ...newSpend, notes: e.target.value })} className="flex-1 min-w-[100px] h-8 text-xs" />
                <Button size="sm" onClick={handleAddSpend} className="h-8">SAVE</Button>
              </div>
            )}
            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-xs font-body">
                <thead><tr className="text-muted-foreground border-b border-border">
                  <th className="text-left p-2">Month</th><th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Amount</th><th className="text-left p-2">Notes</th><th className="p-2"></th>
                </tr></thead>
                <tbody>
                  {spendRows.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="p-2 text-foreground">{s.month}</td>
                      <td className="p-2 capitalize">{s.category}</td>
                      <td className="p-2 text-right">€{Number(s.amount).toLocaleString()}</td>
                      <td className="p-2 text-muted-foreground truncate max-w-[150px]">{s.notes || "—"}</td>
                      <td className="p-2">{!isReadOnly && <Button size="sm" variant="ghost" onClick={() => handleDeleteSpend(s.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>}</td>
                    </tr>
                  ))}
                  {spendRows.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No expenses logged yet</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="CAC" value={unitEcon.cac} prefix="€" decimals={2} />
          <MetricCard label="LTV Estimate" value={unitEcon.ltv} prefix="€" decimals={0} />
          <MetricCard label="LTV/CAC Ratio"
            value={unitEcon.ltvCacRatio} decimals={1} suffix="x"
            highlight={unitEcon.ltvCacRatio < 1}
            color={unitEcon.ltvCacRatio >= 3 ? "#22c55e" : unitEcon.ltvCacRatio >= 1 ? "#f59e0b" : "#ef4444"} />
          <MetricCard label="Gross Margin" value={unitEcon.grossMargin} suffix="%" decimals={1} />
          <MetricCard label="Monthly Burn" value={unitEcon.monthlyBurn} prefix="€" />
          <MetricCard label="Revenue Coverage" value={unitEcon.revCoverage} suffix="%" decimals={0} />
        </div>

        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-body">Revenue vs Spend (12mo)</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitEcon.revVsSpend}>
                <XAxis dataKey="month" tick={TICK_STYLE} />
                <YAxis tick={TICK_STYLE} />
                <Tooltip contentStyle={TT_STYLE} />
                <Bar dataKey="revenue" fill="hsl(210,80%,55%)" name="Platform Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spend" fill="hsl(0,80%,50%)" name="Spend" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={unitEcon.walletLiability > biz.thisMonthFees ? "border-destructive/50" : ""}>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase text-muted-foreground mb-2">Wallet Liability</p>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="font-display text-xl text-foreground">€{unitEcon.walletLiability.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Outstanding</p></div>
              <div><p className="font-display text-xl text-foreground">€{unitEcon.creditsIssuedThisMonth.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Issued this month</p></div>
              <div><p className="font-display text-xl text-foreground">€{unitEcon.creditsSpentThisMonth.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Spent this month</p></div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Outstanding wallet credits are a real financial obligation.</p>
          </CardContent>
        </Card>
      </Section>

      {/* ══════ SECTION 9 — GEOGRAPHIC EXPANSION ══════ */}
      <Section title="GEOGRAPHIC EXPANSION MAP" borderColor="#3B82F6" id="geo"
        onExport={() => downloadCSV(geo.cityTable, "geographic-expansion")}
      >
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body">City Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead><tr className="text-muted-foreground border-b border-border">
                  <th className="text-left p-2">City</th><th className="text-left p-2">Country</th>
                  <th className="text-right p-2">Players</th><th className="text-right p-2">Coaches</th>
                  <th className="text-right p-2">Bookings</th><th className="text-right p-2">GMV</th>
                  <th className="text-right p-2">Avg BV</th><th className="text-center p-2">Status</th>
                </tr></thead>
                <tbody>
                  {geo.cityTable.map((c: any) => (
                    <tr key={c.city} className="border-b border-border/50">
                      <td className="p-2 text-foreground font-medium">{c.city}</td>
                      <td className="p-2">{c.country}</td>
                      <td className="p-2 text-right">{c.players}</td>
                      <td className="p-2 text-right">{c.coaches}</td>
                      <td className="p-2 text-right">{c.bookings}</td>
                      <td className="p-2 text-right">€{c.gmv.toLocaleString()}</td>
                      <td className="p-2 text-right">€{c.avgBV.toFixed(0)}</td>
                      <td className={`p-2 text-center text-[9px] font-display tracking-wider ${c.statusColor}`}>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {geo.demandOnly.length > 0 && (
          <div className="space-y-2">
            {geo.demandOnly.slice(0, 5).map(c => (
              <Card key={c.city} className="border-amber-500/30">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-foreground font-medium">{c.players} players in {c.city} — no coaches yet</p>
                    <p className="text-[10px] text-muted-foreground">Untapped market worth ~€{c.estValue.toLocaleString()}/month</p>
                  </div>
                  <MapPin className="w-4 h-4 text-amber-400" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {geo.countries.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-body">Country Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-body">
                  <thead><tr className="text-muted-foreground border-b border-border">
                    <th className="text-left p-2">Country</th><th className="text-right p-2">Players</th>
                    <th className="text-right p-2">Coaches</th><th className="text-right p-2">GMV</th>
                  </tr></thead>
                  <tbody>
                    {geo.countries.map((c: any) => (
                      <tr key={c.country} className="border-b border-border/50">
                        <td className="p-2 text-foreground">{c.country}</td>
                        <td className="p-2 text-right">{c.players}</td>
                        <td className="p-2 text-right">{c.coaches}</td>
                        <td className="p-2 text-right">€{c.gmv.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* ══════ SECTION 10 — COHORT RETENTION ══════ */}
      <Section title="COHORT RETENTION TABLE" borderColor="#8B5CF6" id="cohort"
        onExport={() => downloadCSV(cohort.retentionTable.map(r => ({
          month: r.month, size: r.size,
          ...Object.fromEntries(r.retention.map((v, i) => [`M${i}`, v !== null ? `${v?.toFixed(1)}%` : "—"]))
        })), "cohort-retention")}
      >
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body">Retention Cohort (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead><tr className="text-muted-foreground border-b border-border">
                  <th className="text-left p-2">Cohort</th><th className="text-right p-2">Size</th>
                  {[0,1,2,3,4,5,6].map(i => <th key={i} className="text-center p-2">M{i}</th>)}
                </tr></thead>
                <tbody>
                  {cohort.retentionTable.map(r => (
                    <tr key={r.month} className="border-b border-border/50">
                      <td className="p-2 text-foreground font-medium">{r.month}</td>
                      <td className="p-2 text-right">{r.size}</td>
                      {r.retention.map((v, i) => (
                        <td key={i} className="p-2 text-center font-medium" style={{
                          backgroundColor: v !== null ? `${retentionColor(v)}20` : "transparent",
                          color: v !== null ? retentionColor(v) : "hsl(0,10%,40%)",
                        }}>
                          {v !== null ? `${v.toFixed(0)}%` : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Avg M1 Retention</p>
            <p className="font-display text-xl text-foreground">{cohort.avgM1.toFixed(1)}%</p>
            <p className={`text-[10px] ${cohort.avgM1 >= 20 ? "text-green-400" : "text-red-400"}`}>
              {cohort.avgM1 >= 20 ? "Above benchmark (20-30%)" : "Below benchmark (20-30%)"}
            </p>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <p className="text-[10px] uppercase text-muted-foreground mb-1">Avg M3 Retention</p>
            <p className="font-display text-xl text-foreground">{cohort.avgM3.toFixed(1)}%</p>
            <p className={`text-[10px] ${cohort.avgM3 >= 10 ? "text-green-400" : "text-red-400"}`}>
              {cohort.avgM3 >= 10 ? "Above benchmark (10-15%)" : "Below benchmark (10-15%)"}
            </p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-body">Revenue Cohort (€/user)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead><tr className="text-muted-foreground border-b border-border">
                  <th className="text-left p-2">Cohort</th><th className="text-right p-2">Size</th>
                  {[0,1,2,3,4,5,6].map(i => <th key={i} className="text-center p-2">M{i}</th>)}
                </tr></thead>
                <tbody>
                  {cohort.revTable.map(r => (
                    <tr key={r.month} className="border-b border-border/50">
                      <td className="p-2 text-foreground font-medium">{r.month}</td>
                      <td className="p-2 text-right">{r.size}</td>
                      {r.revenue.map((v, i) => (
                        <td key={i} className="p-2 text-center">
                          {v !== null ? `€${v.toFixed(0)}` : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ══════ SECTION 11 — COMPETITIVE MOAT ══════ */}
      <Section title="COMPETITIVE MOAT" borderColor="#0F6E56" id="moat"
        onExport={() => downloadCSV(moat.networkDensity, "competitive-moat")}
      >
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Unique Data Points" value={moat.dataPoints} />
          <MetricCard label="Shot Data Profiles" value={moat.shotProfiles} />
          <MetricCard label="Health Data Connections" value={moat.healthDataPoints} />
        </div>

        {moat.networkDensity.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-body">Network Density by City</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-body">
                  <thead><tr className="text-muted-foreground border-b border-border">
                    <th className="text-left p-2">City</th><th className="text-right p-2">Players</th>
                    <th className="text-right p-2">Coaches</th><th className="text-right p-2">Ratio</th>
                    <th className="text-center p-2">Status</th>
                  </tr></thead>
                  <tbody>
                    {moat.networkDensity.slice(0, 15).map((c: any) => (
                      <tr key={c.city} className="border-b border-border/50">
                        <td className="p-2 text-foreground">{c.city}</td>
                        <td className="p-2 text-right">{c.players}</td>
                        <td className="p-2 text-right">{c.coaches}</td>
                        <td className="p-2 text-right">{c.ratio === Infinity ? "∞" : c.ratio.toFixed(1)}</td>
                        <td className={`p-2 text-center text-[9px] font-display ${
                          c.status === "OVER-DEMANDED" ? "text-red-400" : c.status === "UNDER-UTILISED" ? "text-amber-400" : c.status === "NO COACHES" ? "text-red-500" : "text-green-400"
                        }`}>{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Training Blocks" value={moat.totalBlocks} />
          <MetricCard label="Public Programs" value={moat.publicBlocks} />
          <MetricCard label="Training Minutes" value={moat.totalMinutes} />
          <MetricCard label="Videos Uploaded" value={moat.totalVideos} />
          <MetricCard label="Coach Reviews" value={moat.totalReviews} />
        </div>
        <p className="text-[10px] text-muted-foreground italic px-1">
          This proprietary content library and athlete data cannot be replicated by a competitor starting today.
          It grows every session, every review, every upload.
        </p>
      </Section>

      {/* ══════ SECTION 12 — ALERTS & ANOMALIES ══════ */}
      <Section title="ALERTS & ANOMALIES" borderColor="#EF4444" id="alerts">
        {alerts.redAlerts.length === 0 && alerts.greenSignals.length === 0 && (
          <Card className="border-green-500/30">
            <CardContent className="p-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-sm text-green-400 font-display">All systems healthy ✓</p>
            </CardContent>
          </Card>
        )}
        {alerts.redAlerts.length > 0 && (
          <div className="space-y-2">
            {alerts.redAlerts.map((a, i) => (
              <Card key={i} className="border-destructive/40">
                <CardContent className="p-3 flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-xs text-foreground">{a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {alerts.greenSignals.length > 0 && (
          <div className="space-y-2">
            {alerts.greenSignals.map((s, i) => (
              <Card key={i} className="border-green-500/40">
                <CardContent className="p-3 flex items-center gap-3">
                  <PartyPopper className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-xs text-foreground">{s}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* ══════ SECTION 13 — INVESTOR READINESS SCORE ══════ */}
      <Section title="INVESTOR READINESS SCORE" borderColor="#D4537E" id="investor-score">
        <div className="flex flex-col items-center">
          <ArcGauge score={investorScore.total} />
          <p className="text-sm text-muted-foreground mt-2 font-body text-center">{investorScore.interpretation}</p>
        </div>
        <div className="space-y-2">
          {investorScore.components.map(c => (
            <div key={c.name} className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground w-40 shrink-0">{c.name}</p>
              <div className="flex-1 h-3 bg-secondary/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.earned / c.max) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <p className="text-xs text-foreground font-display w-14 text-right">{c.earned}/{c.max}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ══════ BOTTOM — FOUNDER ACTIONS ══════ */}
      {!isReadOnly && (
        <div className="sticky bottom-0 md:bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-20 md:mb-0">
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleExportFull} variant="outline" size="sm">
              <Download className="w-3 h-3 mr-1" /> EXPORT FULL REPORT
            </Button>
            <Button onClick={() => setInvestorModal(true)} variant="outline" size="sm">
              <Crown className="w-3 h-3 mr-1" /> INVESTOR SNAPSHOT
            </Button>
            <Button onClick={handleFindExpansion} variant="outline" size="sm">
              <MapPin className="w-3 h-3 mr-1" /> EXPANSION TARGETS
            </Button>
            <Button onClick={handleNudgeAllAtRisk} variant="outline" size="sm">
              <Send className="w-3 h-3 mr-1" /> NUDGE AT-RISK ({coach.atRiskCoaches.length})
            </Button>
            <Button onClick={() => { setShowSpendForm(true); document.getElementById("spend")?.scrollIntoView({ behavior: "smooth" }); }} variant="outline" size="sm">
              <Plus className="w-3 h-3 mr-1" /> LOG EXPENSE
            </Button>
            <Button onClick={handleShareDashboard} variant="default" size="sm">
              <Share2 className="w-3 h-3 mr-1" /> SHARE DASHBOARD
            </Button>
          </div>
        </div>
      )}

      {/* Expansion Cities Modal */}
      <Dialog open={expansionModal} onOpenChange={setExpansionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Expansion Opportunities</DialogTitle></DialogHeader>
          {expansionCities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cities found with players and 0 coaches.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {expansionCities.map((c: any) => (
                <div key={c.city} className="flex justify-between p-2 rounded bg-secondary/30 text-sm">
                  <span className="text-foreground font-medium">{c.city}</span>
                  <span className="text-muted-foreground">{c.players} players — ~€{c.estValue?.toLocaleString()}/mo</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Investor Snapshot Modal */}
      <Dialog open={investorModal} onOpenChange={setInvestorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Investor Snapshot</DialogTitle></DialogHeader>
          <div className="space-y-2 bg-secondary/20 p-4 rounded-lg font-mono text-sm">
            {investorKPIs.map((k) => (
              <div key={k.label} className="flex justify-between">
                <span className="text-muted-foreground">{k.label}:</span>
                <span className="text-foreground font-medium">{k.value}</span>
              </div>
            ))}
          </div>
          <Button onClick={copyInvestorSnapshot} className="w-full mt-2">
            <Copy className="w-3 h-3 mr-1" /> COPY TO CLIPBOARD
          </Button>
        </DialogContent>
      </Dialog>
      </div>
    </PortalLayout>
  );
};

export default FoundersDashboard;
