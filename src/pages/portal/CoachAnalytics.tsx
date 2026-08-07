import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  ClipboardList,
  Euro,
  Flame,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { format, startOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth } from "date-fns";

const SHOTS: { key: string; label: string }[] = [
  { key: "serve_pct", label: "Serve" },
  { key: "forehand_pct", label: "Forehand" },
  { key: "backhand_pct", label: "Backhand" },
  { key: "volley_pct", label: "Volley" },
  { key: "smash_pct", label: "Smash" },
  { key: "lob_pct", label: "Lob" },
  { key: "bandeja_pct", label: "Bandeja" },
  { key: "vibora_pct", label: "Víbora" },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--sky))",
  "hsl(var(--mustard))",
  "hsl(213 38% 45%)",
  "hsl(160 55% 45%)",
];

interface WeekPoint { label: string; sessions: number; }
interface MonthPoint { label: string; gross: number; payout: number; }
interface PlayerRow {
  id: string;
  name: string;
  sessions: number;
  revenue: number;
  assessments: number;
  delta: number | null;
  lastAssessment: string | null;
}

const nfEur = (n: number) => `€${Math.round(n).toLocaleString("de-DE")}`;

const CoachAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<WeekPoint[]>([]);
  const [months, setMonths] = useState<MonthPoint[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [radar, setRadar] = useState<{ shot: string; avg: number }[]>([]);
  const [packageMix, setPackageMix] = useState<{ name: string; value: number }[]>([]);
  const [kpi, setKpi] = useState({
    players: 0,
    activePlayers: 0,
    sessions30: 0,
    sessions30Prev: 0,
    revenue30: 0,
    revenue30Prev: 0,
    assessments: 0,
    avgRating: 0,
    reviewCount: 0,
    invitesSent: 0,
    invitesClaimed: 0,
    upcoming: 0,
    avgImprovement: 0,
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const today = new Date();
      const iso = (d: Date) => d.toISOString().split("T")[0];
      const from = iso(subMonths(today, 12));

      const [
        { data: bookings },
        { data: assignments },
        { data: assessments },
        { data: reviews },
        { data: invites },
        { data: packages },
        { data: events },
      ] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, booking_date, status, total_price, coach_payout, player_id, package_id")
          .eq("coach_id", user.id)
          .gte("booking_date", from),
        supabase.from("coach_player_assignments").select("player_id, assigned_at").eq("coach_id", user.id),
        supabase
          .from("player_assessments")
          .select(
            "id, player_id, assessment_date, overall_level, serve_pct, forehand_pct, backhand_pct, volley_pct, smash_pct, lob_pct, bandeja_pct, vibora_pct",
          )
          .eq("coach_id", user.id)
          .order("assessment_date", { ascending: true }),
        supabase.from("reviews").select("rating").eq("coach_id", user.id),
        supabase.from("coach_invites").select("id, accepted_at").eq("coach_id", user.id),
        supabase.from("coach_packages").select("id, title, price_per_session").eq("coach_id", user.id),
        supabase.from("events").select("id, start_datetime, current_participants").eq("coach_id", user.id),
      ]);

      if (cancelled) return;

      const bk = bookings || [];
      const confirmed = bk.filter((b) => b.status === "confirmed" || b.status === "completed");

      // ---- weekly sessions (last 12 weeks)
      const weekPoints: WeekPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const start = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        weekPoints.push({
          label: format(start, "dd.MM"),
          sessions: confirmed.filter((b) => b.booking_date >= iso(start) && b.booking_date <= iso(end)).length,
        });
      }
      setWeeks(weekPoints);

      // ---- monthly revenue (last 6 months)
      const monthPoints: MonthPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(today, i);
        const s = iso(startOfMonth(d));
        const e = iso(endOfMonth(d));
        const inMonth = confirmed.filter((b) => b.booking_date >= s && b.booking_date <= e);
        monthPoints.push({
          label: format(d, "MMM"),
          gross: inMonth.reduce((sum, b) => sum + Number(b.total_price || 0), 0),
          payout: inMonth.reduce((sum, b) => sum + Number(b.coach_payout || 0), 0),
        });
      }
      setMonths(monthPoints);

      // ---- per player rollup
      const ids = new Set<string>([
        ...(assignments || []).map((a) => a.player_id),
        ...confirmed.map((b) => b.player_id),
        ...(assessments || []).map((a) => a.player_id).filter(Boolean as unknown as (v: string | null) => v is string),
      ]);
      const idList = Array.from(ids);
      const { data: profs } = idList.length
        ? await supabase.from("profiles").select("user_id, full_name").in("user_id", idList)
        : { data: [] as { user_id: string; full_name: string }[] };

      const rows: PlayerRow[] = idList.map((id) => {
        const mine = confirmed.filter((b) => b.player_id === id);
        const as = (assessments || []).filter((a) => a.player_id === id);
        const first = as[0];
        const last = as[as.length - 1];
        const delta =
          as.length > 1 && first?.overall_level != null && last?.overall_level != null
            ? Number(last.overall_level) - Number(first.overall_level)
            : null;
        return {
          id,
          name: profs?.find((p: any) => p.user_id === id)?.full_name || "Unknown player",
          sessions: mine.length,
          revenue: mine.reduce((s, b) => s + Number(b.coach_payout || 0), 0),
          assessments: as.length,
          delta,
          lastAssessment: last?.assessment_date || null,
        };
      });
      rows.sort((a, b) => b.sessions - a.sessions || b.revenue - a.revenue);
      setPlayers(rows);

      // ---- radar: average of each player's latest assessment
      const latestByPlayer = new Map<string, any>();
      (assessments || []).forEach((a) => a.player_id && latestByPlayer.set(a.player_id, a));
      const latest = Array.from(latestByPlayer.values());
      setRadar(
        SHOTS.map((s) => ({
          shot: s.label,
          avg: latest.length
            ? Math.round(latest.reduce((sum, a) => sum + Number(a[s.key] || 0), 0) / latest.length)
            : 0,
        })),
      );

      // ---- package mix
      const byPkg = new Map<string, number>();
      confirmed.forEach((b) => {
        const title = (packages || []).find((p) => p.id === b.package_id)?.title || "Direct / custom";
        byPkg.set(title, (byPkg.get(title) || 0) + 1);
      });
      setPackageMix(
        Array.from(byPkg.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5),
      );

      // ---- KPIs
      const d30 = iso(subWeeks(today, 4));
      const d60 = iso(subWeeks(today, 8));
      const in30 = confirmed.filter((b) => b.booking_date >= d30);
      const in30Prev = confirmed.filter((b) => b.booking_date >= d60 && b.booking_date < d30);
      const deltas = rows.map((r) => r.delta).filter((d): d is number => d != null);
      setKpi({
        players: idList.length,
        activePlayers: new Set(in30.map((b) => b.player_id)).size,
        sessions30: in30.length,
        sessions30Prev: in30Prev.length,
        revenue30: in30.reduce((s, b) => s + Number(b.coach_payout || 0), 0),
        revenue30Prev: in30Prev.reduce((s, b) => s + Number(b.coach_payout || 0), 0),
        assessments: (assessments || []).length,
        avgRating: reviews?.length
          ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length
          : 0,
        reviewCount: reviews?.length || 0,
        invitesSent: invites?.length || 0,
        invitesClaimed: (invites || []).filter((i) => i.accepted_at).length,
        upcoming: (events || []).filter((e) => new Date(e.start_datetime) > today).length,
        avgImprovement: deltas.length ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0,
      });

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const trend = (now: number, prev: number) => {
    if (!prev) return now ? 100 : 0;
    return ((now - prev) / prev) * 100;
  };

  const kpiCards = useMemo(
    () => [
      {
        label: "Sessions · 30d",
        value: String(kpi.sessions30),
        sub: `${kpi.activePlayers} active players`,
        icon: Activity,
        delta: trend(kpi.sessions30, kpi.sessions30Prev),
        tone: "primary" as const,
      },
      {
        label: "Payout · 30d",
        value: nfEur(kpi.revenue30),
        sub: "after platform fee",
        icon: Euro,
        delta: trend(kpi.revenue30, kpi.revenue30Prev),
        tone: "sky" as const,
      },
      {
        label: "Assessments",
        value: String(kpi.assessments),
        sub: kpi.avgImprovement
          ? `${kpi.avgImprovement > 0 ? "+" : ""}${kpi.avgImprovement.toFixed(2)} avg level gain`
          : "no progression data yet",
        icon: ClipboardList,
        delta: null,
        tone: "mustard" as const,
      },
      {
        label: "Roster",
        value: String(kpi.players),
        sub: `${kpi.invitesClaimed}/${kpi.invitesSent || 0} invites claimed`,
        icon: Users,
        delta: null,
        tone: "primary" as const,
      },
    ],
    [kpi],
  );

  const funnel = useMemo(() => {
    const assessed = players.filter((p) => p.assessments > 0).length;
    const booked = players.filter((p) => p.sessions > 0).length;
    const repeat = players.filter((p) => p.sessions > 1).length;
    return [
      { label: "Invited", value: kpi.invitesSent || kpi.players },
      { label: "Joined", value: kpi.players },
      { label: "Assessed", value: assessed },
      { label: "Booked", value: booked },
      { label: "Repeat", value: repeat },
    ];
  }, [players, kpi]);

  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
    color: "hsl(var(--foreground))",
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="space-y-4 max-w-6xl">
          <div className="h-28 rounded-2xl bg-muted/60" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted/50" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-muted/40" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-6xl pb-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-border p-6 sm:p-8">
          <div
            className="absolute inset-0 -z-10 opacity-90"
            style={{
              background:
                "radial-gradient(120% 140% at 0% 0%, hsl(var(--primary) / 0.28) 0%, transparent 55%), radial-gradient(110% 120% at 100% 10%, hsl(var(--sky) / 0.30) 0%, transparent 60%), linear-gradient(140deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
            }}
          />
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Sparkles size={16} />
                <span className="text-[10px] font-body uppercase tracking-[0.2em]">Coach intelligence</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground uppercase mt-2">
                Analytics
              </h1>
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mt-2 max-w-md">
                Sessions, revenue, player development and funnel conversion — all in one place
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <div className="flex items-center gap-1.5" style={{ color: "hsl(var(--mustard))" }}>
                  <Star size={16} />
                  <span className="font-display text-2xl text-foreground">
                    {kpi.avgRating ? kpi.avgRating.toFixed(1) : "—"}
                  </span>
                </div>
                <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mt-1">
                  {kpi.reviewCount} reviews
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-primary">
                  <Flame size={16} />
                  <span className="font-display text-2xl text-foreground">{kpi.upcoming}</span>
                </div>
                <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mt-1">
                  Upcoming events
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((c) => {
            const up = (c.delta ?? 0) >= 0;
            return (
              <Card key={c.label} className="relative overflow-hidden p-5">
                <div
                  className="absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl"
                  style={{
                    background:
                      c.tone === "sky"
                        ? "hsl(var(--sky) / 0.35)"
                        : c.tone === "mustard"
                          ? "hsl(var(--mustard) / 0.35)"
                          : "hsl(var(--primary) / 0.30)",
                  }}
                />
                <div className="flex items-start justify-between">
                  <c.icon size={20} className="text-primary" />
                  {c.delta !== null && (
                    <span
                      className={`flex items-center gap-1 text-[10px] font-body uppercase tracking-wider ${
                        up ? "text-emerald-500" : "text-destructive"
                      }`}
                    >
                      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(c.delta).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="font-display text-3xl text-foreground mt-3">{c.value}</div>
                <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mt-1">
                  {c.label}
                </div>
                <div className="text-[10px] font-body text-muted-foreground/80 mt-2">{c.sub}</div>
              </Card>
            );
          })}
        </div>

        {/* Sessions + revenue */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg text-foreground uppercase tracking-wide">Session momentum</h2>
                <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Last 12 weeks</p>
              </div>
              <Activity size={18} className="text-primary" />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeks}>
                  <defs>
                    <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#sessionsFill)"
                    isAnimationActive={false}
                    dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg text-foreground uppercase tracking-wide">Revenue</h2>
                <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Gross vs payout</p>
              </div>
              <Euro size={18} style={{ color: "hsl(var(--sky))" }} />
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} barGap={2}>
                  <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => nfEur(Number(v))} />
                  <Bar dataKey="gross" fill="hsl(var(--sky))" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="payout" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Funnel + radar + package mix */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground uppercase tracking-wide">Conversion funnel</h2>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Invite → repeat client</p>
            <div className="mt-5 space-y-3">
              {funnel.map((f, i) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-[11px] font-body">
                    <span className="uppercase tracking-wider text-muted-foreground">{f.label}</span>
                    <span className="text-foreground font-display">{f.value}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(f.value / funnelMax) * 100}%`,
                        background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--sky)) 100%)`,
                        opacity: 1 - i * 0.13,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground uppercase tracking-wide">Squad shot profile</h2>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">
              Average of latest assessments
            </p>
            <div className="h-56 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="shot" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar
                    dataKey="avg"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.28}
                    isAnimationActive={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground uppercase tracking-wide">Package mix</h2>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Sessions by product</p>
            {packageMix.length === 0 ? (
              <p className="text-xs font-body text-muted-foreground mt-6">No confirmed sessions yet.</p>
            ) : (
              <>
                <div className="h-40 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={packageMix}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={3}
                        isAnimationActive={false}
                        stroke="none"
                      >
                        {packageMix.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-3">
                  {packageMix.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2 text-[11px] font-body">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground truncate flex-1">{p.name}</span>
                      <span className="text-foreground">{p.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Player table */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg text-foreground uppercase tracking-wide">Player breakdown</h2>
              <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">
                Sessions, payout and level development
              </p>
            </div>
            <Link
              to="/coach/players"
              className="flex items-center gap-1 text-[10px] font-body uppercase tracking-wider text-primary"
            >
              All players <ArrowUpRight size={12} />
            </Link>
          </div>

          {players.length === 0 ? (
            <p className="text-xs font-body text-muted-foreground">No players yet — share your join link to start.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] font-body uppercase tracking-[0.15em] text-muted-foreground">
                    <th className="px-2 py-2">Player</th>
                    <th className="px-2 py-2 text-right">Sessions</th>
                    <th className="px-2 py-2 text-right">Payout</th>
                    <th className="px-2 py-2 text-right">Assessments</th>
                    <th className="px-2 py-2 text-right">Level Δ</th>
                    <th className="px-2 py-2 text-right">Last rated</th>
                  </tr>
                </thead>
                <tbody>
                  {players.slice(0, 12).map((p) => (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="px-2 py-3">
                        <Link
                          to={`/coach/players/${p.id}`}
                          className="text-sm font-body text-foreground hover:text-primary"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-2 py-3 text-right text-sm font-display text-foreground">{p.sessions}</td>
                      <td className="px-2 py-3 text-right text-sm font-body text-muted-foreground">
                        {nfEur(p.revenue)}
                      </td>
                      <td className="px-2 py-3 text-right text-sm font-body text-muted-foreground">{p.assessments}</td>
                      <td className="px-2 py-3 text-right text-sm font-body">
                        {p.delta == null ? (
                          <span className="text-muted-foreground/60">—</span>
                        ) : (
                          <span className={p.delta >= 0 ? "text-emerald-500" : "text-destructive"}>
                            {p.delta > 0 ? "+" : ""}
                            {p.delta.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right text-[11px] font-body text-muted-foreground">
                        {p.lastAssessment ? format(new Date(p.lastAssessment), "dd MMM yyyy") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  );
};

export default CoachAnalytics;
