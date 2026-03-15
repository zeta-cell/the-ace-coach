import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw, Download, ChevronDown, ChevronRight, TrendingUp, Users,
  AlertTriangle, Zap, Target, Send, Copy, MapPin, Crown, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
const MetricCard = ({ label, value, prefix, suffix, decimals, highlight }: {
  label: string; value: number; prefix?: string; suffix?: string; decimals?: number; highlight?: boolean;
}) => (
  <Card className={`${highlight ? "border-destructive/50" : ""}`}>
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

// ─── Main Component ─────────────────────────────────────
const FoundersDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [d, setD] = useState<any>({});
  const [expansionModal, setExpansionModal] = useState(false);
  const [investorModal, setInvestorModal] = useState(false);
  const [expansionCities, setExpansionCities] = useState<any[]>([]);

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
      });
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

    // Monthly revenue for chart
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

    // Growth chart
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

    return {
      gmv, mrr, arr: mrr * 12, platformRev,
      avgBooking: confirmed.length ? gmv / confirmed.length : 0,
      revPerUser: players.length ? gmv / players.length : 0,
      takeRate: gmv > 0 ? (platformRev / gmv) * 100 : 0,
      viralCoeff: totalUsers > 0 ? (completedRefs.length / totalUsers) * 100 : 0,
      revChart, growthChart,
    };
  }, [d]);

  // ─── SECTION 2: CUSTOMER INTELLIGENCE ───────────────
  const cust = useMemo(() => {
    const pp = d.playerProfiles || [];
    const b = d.bookings || [];

    // Age distribution
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

    // Sport preference
    const sportCount: Record<string, number> = { tennis: 0, padel: 0, both: 0 };
    pp.forEach((p: any) => { if (p.preferred_sport && sportCount[p.preferred_sport] !== undefined) sportCount[p.preferred_sport]++; });
    const sportChart = Object.entries(sportCount).map(([name, value]) => ({ name, value }));

    // Fitness level
    const fitCount: Record<string, number> = {};
    pp.forEach((p: any) => { if (p.fitness_level) fitCount[p.fitness_level] = (fitCount[p.fitness_level] || 0) + 1; });
    const fitnessChart = Object.entries(fitCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Peak booking day
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

    // Training freq
    const freqCount: Record<string, number> = {};
    pp.forEach((p: any) => { if (p.training_freq) freqCount[p.training_freq] = (freqCount[p.training_freq] || 0) + 1; });
    const freqChart = Object.entries(freqCount).map(([name, value]) => ({ name, value }));

    // Top cities
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

    // Coaches with 0 bookings
    const coachIdsWithBookings = new Set(b.map((x: any) => x.coach_id));
    const zeroBookingCoaches = cp.filter((c: any) => !coachIdsWithBookings.has(c.user_id)).length;

    const avgPkgs = totalCoaches > 0 ? pkgs.length / totalCoaches : 0;
    const avgPrice = pkgs.length > 0 ? pkgs.reduce((s: number, p: any) => s + Number(p.price_per_session || 0), 0) / pkgs.length : 0;

    // Top 10 coaches by payout
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
          userId: c.user_id,
          name: p?.full_name || "Unknown",
          location: c.location_city || "-",
          sessions: coachSessionMap[c.user_id] || 0,
          revenue: coachRevMap[c.user_id] || 0,
          avgRating: rating ? (rating.sum / rating.count).toFixed(1) : "-",
          badge: c.badge_level,
          verified: c.is_verified,
        };
      })
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // At-risk coaches
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

    // Badge distribution
    const badgeCounts: Record<string, number> = { starter: 0, pro: 0, elite: 0, legend: 0 };
    cp.forEach((c: any) => { if (badgeCounts[c.badge_level] !== undefined) badgeCounts[c.badge_level]++; });
    const badgeChart = Object.entries(badgeCounts).map(([name, value]) => ({ name, value }));

    // Marketplace stats
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

    // Top brands
    const brandCount: Record<string, number> = {};
    rackets.forEach((r: any) => {
      const brand = (r.brand || "").trim().toLowerCase();
      if (brand) brandCount[brand] = (brandCount[brand] || 0) + 1;
    });
    const brandChart = Object.entries(brandCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    // Racket type
    const typeCount: Record<string, number> = { power: 0, control: 0, mixed: 0 };
    rackets.forEach((r: any) => { if (r.type && typeCount[r.type] !== undefined) typeCount[r.type]++; });
    const typeChart = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

    // Dominant hand
    const leftHand = pp.filter((p: any) => p.dominant_hand === "left").length;
    const rightHand = pp.filter((p: any) => p.dominant_hand === "right").length;

    // String brands
    const stringCount: Record<string, number> = {};
    rackets.forEach((r: any) => {
      const sb = (r.string_brand || "").trim();
      if (sb) stringCount[sb] = (stringCount[sb] || 0) + 1;
    });
    const topStrings = Object.entries(stringCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Module category usage
    const catCount: Record<string, number> = {};
    items.forEach((item: any) => {
      const cat = (item as any).modules?.category;
      if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const moduleChart = Object.entries(catCount).sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // Health device adoption
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

    // Funnel
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

    // Gap analysis
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

    return {
      funnel, coachesNoPkgs, estimatedLostGMV, browsersNotBooking,
      incompleteProfiles, unverifiedReady, abandonedBookings,
    };
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

    // Level distribution
    const levelCounts: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0, legend: 0 };
    us.forEach((u: any) => { if (u.current_level && levelCounts[u.current_level] !== undefined) levelCounts[u.current_level]++; });
    const levelChart = Object.entries(levelCounts).map(([name, value]) => ({ name, value, fill: LEVEL_COLORS[name] || "#888" }));

    // Events
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

    // Referral funnel
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
    ];
    downloadCSV(rows, `founders-report-${new Date().toISOString().split("T")[0]}`);
    toast("Report downloaded");
  };

  const handleFindExpansion = () => {
    const pp = d.playerProfiles || [];
    const cp = d.coachProfiles || [];
    const cityPlayers: Record<string, number> = {};
    pp.forEach((p: any) => { if (p.club_location) cityPlayers[p.club_location] = (cityPlayers[p.club_location] || 0) + 1; });
    const coachCities = new Set(cp.map((c: any) => c.location_city).filter(Boolean));
    const opportunities = Object.entries(cityPlayers)
      .filter(([city, count]) => count >= 2 && !coachCities.has(city))
      .sort((a, b) => b[1] - a[1])
      .map(([city, count]) => ({ city, players: count, coaches: 0 }));
    setExpansionCities(opportunities);
    setExpansionModal(true);
  };

  const handleNudgeAllAtRisk = async () => {
    const msg = "Your profile is looking great! Need help getting your first booking? Reply to this message and we'll feature you on the homepage.";
    const inserts = coach.atRiskCoaches.map((c: any) => ({
      user_id: c.userId,
      title: "Let's get you booked! 🎾",
      body: msg,
      link: "/coach",
    }));
    if (inserts.length === 0) { toast("No at-risk coaches"); return; }
    const { error } = await supabase.from("notifications").insert(inserts);
    if (error) toast("Failed to send");
    else toast(`Nudge sent to ${inserts.length} coaches`);
  };

  const handleSendNudge = async (userId: string) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title: "Let's get you booked! 🎾",
      body: "Your profile is looking great! Need help getting your first booking? Reply to this message and we'll feature you on the homepage.",
      link: "/coach",
    });
    if (error) toast("Failed"); else toast("Nudge sent");
  };

  const investorKPIs = useMemo(() => [
    { label: "GMV", value: `€${biz.gmv.toLocaleString()}` },
    { label: "MRR", value: `€${biz.mrr.toLocaleString()}` },
    { label: "ARR", value: `€${biz.arr.toLocaleString()}` },
    { label: "Users", value: (d.profiles || []).length },
    { label: "Coaches", value: coach.totalCoaches },
    { label: "Take Rate", value: `${biz.takeRate.toFixed(1)}%` },
    { label: "Viral Coefficient", value: `${biz.viralCoeff.toFixed(1)}%` },
    { label: "D30 Retention", value: `${lost.funnel.length >= 5 && lost.funnel[0].count > 0 ? ((lost.funnel[4].count / lost.funnel[0].count) * 100).toFixed(1) : 0}%` },
    { label: "Avg Booking Value", value: `€${biz.avgBooking.toFixed(0)}` },
    { label: "Top City", value: cust.topCities[0]?.city || "-" },
    { label: "Top Coach", value: coach.topCoaches[0]?.name || "-" },
    { label: "Platform Revenue", value: `€${biz.platformRev.toLocaleString()}` },
  ], [biz, coach, cust, lost, d]);

  const copyInvestorSnapshot = () => {
    const text = investorKPIs.map(k => `${k.label}: ${k.value}`).join("\n");
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  };

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

  return (
    <PortalLayout>
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
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} width={90} />
                  <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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

        {/* Top cities */}
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
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} width={100} />
                <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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

        {/* Top 10 coaches */}
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

        {/* At-risk coaches */}
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
                    <Button size="sm" variant="outline" onClick={() => handleSendNudge(c.userId)}>
                      <Send className="w-3 h-3 mr-1" /> NUDGE
                    </Button>
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
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} width={60} />
                  <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} width={80} />
                  <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} width={90} />
                <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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
        {/* Funnel */}
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
                        style={{
                          background: `linear-gradient(90deg, hsl(45,90%,55%) 0%, hsl(0,80%,50%) 100%)`,
                          opacity: 1 - i * 0.15,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gap Analysis */}
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
              <Button size="sm" variant="outline" onClick={() => navigate("/admin")}>
                GO TO VERIFICATION →
              </Button>
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
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} width={70} />
                <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
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
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(0,10%,60%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(0,50%,12%)", border: "1px solid hsl(0,40%,20%)", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(170,70%,45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Referral funnel */}
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

      {/* ══════ BOTTOM — FOUNDER ACTIONS ══════ */}
      <div className="sticky bottom-0 md:bottom-0 z-30 bg-card/95 backdrop-blur-md border-t border-border -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-20 md:mb-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportFull} variant="outline" size="sm">
            <Download className="w-3 h-3 mr-1" /> EXPORT FULL REPORT
          </Button>
          <Button onClick={handleFindExpansion} variant="outline" size="sm">
            <MapPin className="w-3 h-3 mr-1" /> FIND EXPANSION CITIES
          </Button>
          <Button onClick={handleNudgeAllAtRisk} variant="outline" size="sm">
            <Send className="w-3 h-3 mr-1" /> EMAIL AT-RISK COACHES ({coach.atRiskCoaches.length})
          </Button>
          <Button onClick={() => setInvestorModal(true)} variant="default" size="sm">
            <Crown className="w-3 h-3 mr-1" /> INVESTOR SNAPSHOT
          </Button>
        </div>
      </div>

      {/* Expansion Cities Modal */}
      <Dialog open={expansionModal} onOpenChange={setExpansionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Expansion Opportunities</DialogTitle></DialogHeader>
          {expansionCities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cities found with 2+ players and 0 coaches.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {expansionCities.map((c: any) => (
                <div key={c.city} className="flex justify-between p-2 rounded bg-secondary/30 text-sm">
                  <span className="text-foreground font-medium">{c.city}</span>
                  <span className="text-muted-foreground">{c.players} players, 0 coaches — potential market</span>
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
    </PortalLayout>
  );
};

export default FoundersDashboard;
