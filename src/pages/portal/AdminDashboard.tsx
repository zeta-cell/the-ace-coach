import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Users, BookOpen, Video, CreditCard, TrendingUp, Activity, Database, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";

interface Stats {
  total_users: number;
  total_coaches: number;
  total_players: number;
  total_modules: number;
  total_videos: number;
  total_plans: number;
  total_payments: number;
  total_revenue: number;
  registrations_by_month: { month: string; count: number }[] | null;
  revenue_by_month: { month: string; type: string; total: number }[] | null;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const { data, error } = await supabase.rpc("admin_get_stats");
    if (error) {
      console.error("Stats error:", error.message);
      if (error.message?.includes("Not authorized")) {
        toast.error("Session abgelaufen", { description: "Bitte logge dich erneut ein." });
      }
    }
    if (!error && data) setStats(data as unknown as Stats);
    setLoading(false);
  };

  const registrationData = stats?.registrations_by_month?.map((r: any) => ({
    month: r.month,
    count: Number(r.count),
  })) || [];

  const revenueData = stats?.revenue_by_month?.map((r: any) => ({
    month: r.month,
    total: Number(r.total),
  })) || [];

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-500" },
        { label: "Players", value: stats.total_players, icon: Activity, color: "text-green-500" },
        { label: "Coaches", value: stats.total_coaches, icon: Users, color: "text-purple-500" },
        { label: "Modules", value: stats.total_modules, icon: BookOpen, color: "text-cyan-500" },
        { label: "Videos", value: stats.total_videos, icon: Video, color: "text-pink-500" },
        { label: "Revenue", value: `€${Number(stats.total_revenue).toLocaleString()}`, icon: CreditCard, color: "text-primary" },
      ]
    : [];

  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await supabase.functions.invoke("seed-data");
      if (res.error) throw res.error;
      toast.success("Seed complete!", {
        description: res.data?.details?.slice(0, 5).join("\n") || res.data?.message,
        duration: 8000,
      });
      fetchStats();
    } catch (err: any) {
      toast.error("Seed failed", { description: err.message });
    }
    setSeeding(false);
  };

  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-foreground">COMMAND CENTER</h1>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-foreground font-display text-xs tracking-wider hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            {seeding ? "SEEDING..." : "SEED TEST DATA"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <s.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-2xl text-foreground leading-none">{s.value}</p>
                    <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Registrations over time */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">REGISTRATIONS</h2>
                {registrationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={registrationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="font-body text-sm text-muted-foreground text-center py-8">No data yet</p>
                )}
              </motion.div>

              {/* Revenue over time */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">REVENUE</h2>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        formatter={(value: number) => [`€${value}`, "Revenue"]}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="font-body text-sm text-muted-foreground text-center py-8">No payments yet</p>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default AdminDashboard;
