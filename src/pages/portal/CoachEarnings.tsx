import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "@/components/portal/PortalLayout";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface MonthBucket { month: string; gross: number; payout: number; sessions: number; }
interface TopClient { player_id: string; full_name: string; sessions: number; revenue: number; }

const CoachEarnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthData, setMonthData] = useState<MonthBucket[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [totals, setTotals] = useState({ ytdPayout: 0, monthPayout: 0, pendingPayout: 0, sessionsYtd: 0, avgPerSession: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
      const monthStart = startOfMonth(new Date()).toISOString().split("T")[0];

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, booking_date, status, total_price, coach_payout, player_id, currency")
        .eq("coach_id", user.id)
        .gte("booking_date", yearStart);

      const list = bookings || [];

      // Monthly buckets — last 6 months
      const months: MonthBucket[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        const s = startOfMonth(d).toISOString().split("T")[0];
        const e = endOfMonth(d).toISOString().split("T")[0];
        const monthBookings = list.filter((b) => b.booking_date >= s && b.booking_date <= e && b.status === "confirmed");
        months.push({
          month: format(d, "MMM"),
          gross: monthBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0),
          payout: monthBookings.reduce((sum, b) => sum + Number(b.coach_payout || 0), 0),
          sessions: monthBookings.length,
        });
      }
      setMonthData(months);

      // Top clients YTD
      const confirmed = list.filter((b) => b.status === "confirmed");
      const byPlayer = new Map<string, { sessions: number; revenue: number }>();
      confirmed.forEach((b) => {
        const cur = byPlayer.get(b.player_id) || { sessions: 0, revenue: 0 };
        cur.sessions += 1;
        cur.revenue += Number(b.coach_payout || 0);
        byPlayer.set(b.player_id, cur);
      });
      const playerIds = Array.from(byPlayer.keys());
      const { data: profs } = playerIds.length
        ? await supabase.from("profiles").select("user_id, full_name").in("user_id", playerIds)
        : { data: [] };
      const top = playerIds.map((id) => ({
        player_id: id,
        full_name: profs?.find((p: any) => p.user_id === id)?.full_name || "Unknown",
        sessions: byPlayer.get(id)!.sessions,
        revenue: byPlayer.get(id)!.revenue,
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      setTopClients(top);

      // Totals
      const ytdPayout = confirmed.reduce((s, b) => s + Number(b.coach_payout || 0), 0);
      const monthPayout = confirmed
        .filter((b) => b.booking_date >= monthStart)
        .reduce((s, b) => s + Number(b.coach_payout || 0), 0);
      const pendingPayout = list
        .filter((b) => b.status === "pending")
        .reduce((s, b) => s + Number(b.coach_payout || 0), 0);
      setTotals({
        ytdPayout,
        monthPayout,
        pendingPayout,
        sessionsYtd: confirmed.length,
        avgPerSession: confirmed.length ? ytdPayout / confirmed.length : 0,
      });

      setLoading(false);
    })();
  }, [user]);

  if (loading) return <PortalLayout><div className="p-6 text-muted-foreground">Loading earnings…</div></PortalLayout>;

  const cards = [
    { label: "YTD Payout", value: `€${totals.ytdPayout.toFixed(0)}`, icon: DollarSign, color: "text-primary" },
    { label: "This Month", value: `€${totals.monthPayout.toFixed(0)}`, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Pending", value: `€${totals.pendingPayout.toFixed(0)}`, icon: Calendar, color: "text-amber-400" },
    { label: "Avg / Session", value: `€${totals.avgPerSession.toFixed(0)}`, icon: Users, color: "text-foreground" },
  ];

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">Earnings</h1>
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mt-1">
            Your coaching revenue at a glance
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label} className="p-5">
              <c.icon className={`${c.color} mb-3`} size={22} />
              <div className="text-2xl font-display text-foreground">{c.value}</div>
              <div className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mt-1">{c.label}</div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm uppercase tracking-wider text-foreground">Last 6 Months</h2>
            <span className="text-xs text-muted-foreground">{totals.sessionsYtd} sessions YTD</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any, n) => [`€${Number(v).toFixed(0)}`, n === "payout" ? "Your payout" : "Gross"]}
                />
                <Bar dataKey="gross" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payout" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-4">Top Clients (YTD)</h2>
          {topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No confirmed sessions yet this year.</p>
          ) : (
            <div className="space-y-2">
              {topClients.map((c, i) => (
                <div key={c.player_id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-body text-sm text-foreground">{c.full_name}</div>
                      <div className="text-xs text-muted-foreground">{c.sessions} sessions</div>
                    </div>
                  </div>
                  <div className="font-display text-foreground">€{c.revenue.toFixed(0)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PortalLayout>
  );
};

export default CoachEarnings;
