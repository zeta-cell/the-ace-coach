import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Heart, Moon, Zap, RefreshCw, Loader2, Battery } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

interface HealthRecord {
  date: string;
  provider: string;
  recovery_score: number | null;
  sleep_hours: number | null;
  hrv_ms: number | null;
  resting_hr: number | null;
  strain_score: number | null;
}

interface HealthConnection {
  provider: string;
  is_connected: boolean;
}

const PROVIDER_FNS: Record<string, string> = {
  whoop: "whoop-oauth",
  oura: "oura-oauth",
  polar: "polar-oauth",
  garmin: "garmin-oauth",
};

const HealthDataCard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<HealthRecord[]>([]);
  const [connections, setConnections] = useState<HealthConnection[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [connRes, dataRes] = await Promise.all([
      supabase.from("health_connections").select("provider, is_connected").eq("user_id", user.id).eq("is_connected", true),
      supabase.from("health_data").select("date, provider, recovery_score, sleep_hours, hrv_ms, resting_hr, strain_score")
        .eq("user_id", user.id).gte("date", format(subDays(new Date(), 7), "yyyy-MM-dd")).order("date"),
    ]);
    setConnections(connRes.data || []);
    setData(dataRes.data || []);
  };

  const syncAll = async () => {
    if (!user) return;
    setSyncing(true);
    for (const conn of connections) {
      const fn = PROVIDER_FNS[conn.provider];
      if (fn) {
        try {
          await supabase.functions.invoke(fn, { body: { action: "sync", user_id: user.id } });
        } catch {}
      }
    }
    await fetchData();
    setSyncing(false);
    toast.success("Health data synced");
  };

  const connected = connections.length > 0;
  const latest = data.length > 0 ? data[data.length - 1] : null;

  // Check for Garmin Body Battery
  const garminConnected = connections.some(c => c.provider === "garmin");
  const latestGarminData = data.filter(d => d.provider === "garmin");
  const latestBodyBattery = latestGarminData.length > 0 ? latestGarminData[latestGarminData.length - 1].strain_score : null;

  const recoveryColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 67) return "text-green-400";
    if (score >= 34) return "text-amber-400";
    return "text-red-400";
  };

  const bodyBatteryColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-amber-400";
    if (score >= 25) return "text-orange-400";
    return "text-red-400";
  };

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const dayData = data.filter(d => d.date === date);
    return {
      name: format(subDays(new Date(), 6 - i), "EEE"),
      recovery: dayData.find(d => d.recovery_score)?.recovery_score || null,
      hrv: dayData.find(d => d.hrv_ms)?.hrv_ms || null,
      sleep: dayData.find(d => d.sleep_hours)?.sleep_hours || null,
    };
  });

  const readinessMessage = () => {
    const score = latest?.recovery_score;
    if (!score) return { text: "Connect a health device to see your readiness", color: "text-muted-foreground" };
    if (score >= 67) return { text: "Great recovery today — ideal for intense training", color: "text-green-400" };
    if (score >= 34) return { text: "Moderate recovery — stick to planned sessions", color: "text-amber-400" };
    return { text: "Low recovery — consider a rest day or light session", color: "text-red-400" };
  };

  const readiness = readinessMessage();

  if (!connected) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center">
        <Activity size={24} className="mx-auto text-muted-foreground mb-2" />
        <h3 className="font-display text-sm text-foreground mb-1">HEALTH & RECOVERY</h3>
        <p className="font-body text-xs text-muted-foreground mb-3">Connect your health devices to see recovery data</p>
        <div className="flex justify-center gap-1.5">
          {[
            { label: "WHOOP", color: "#00F19F" },
            { label: "OURA", color: "#6B63F6" },
            { label: "POLAR", color: "#D0112B" },
            { label: "GARMIN", color: "#007CC3" },
          ].map((b) => (
            <div
              key={b.label}
              className="px-2 h-7 rounded-md flex items-center justify-center text-white font-display text-[9px] tracking-[0.14em] opacity-80"
              style={{ backgroundColor: b.color }}
            >
              {b.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
          <Activity size={14} className="text-primary" /> HEALTH & RECOVERY
        </h3>
        <button onClick={syncAll} disabled={syncing} className="text-xs font-display text-primary flex items-center gap-1 hover:underline disabled:opacity-50">
          {syncing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />} SYNC
        </button>
      </div>

      {/* Metric strip */}
      <div className={`grid ${garminConnected ? "grid-cols-5" : "grid-cols-4"} gap-2 mb-4`}>
        <div className="text-center">
          <Heart size={14} className={`mx-auto mb-0.5 ${recoveryColor(latest?.recovery_score ?? null)}`} />
          <p className={`font-display text-lg ${recoveryColor(latest?.recovery_score ?? null)}`}>
            {latest?.recovery_score ?? "—"}
          </p>
          <p className="text-[8px] font-body text-muted-foreground">RECOVERY</p>
          <span className="text-[7px] font-display text-muted-foreground bg-muted px-1 rounded">
            {data.find(d => d.recovery_score)?.provider?.toUpperCase() || "—"}
          </span>
        </div>
        <div className="text-center">
          <Moon size={14} className="mx-auto mb-0.5 text-blue-400" />
          <p className="font-display text-lg text-blue-400">{latest?.sleep_hours ? Number(latest.sleep_hours).toFixed(1) : "—"}</p>
          <p className="text-[8px] font-body text-muted-foreground">SLEEP HRS</p>
        </div>
        <div className="text-center">
          <Zap size={14} className="mx-auto mb-0.5 text-purple-400" />
          <p className="font-display text-lg text-purple-400">{latest?.hrv_ms ?? "—"}</p>
          <p className="text-[8px] font-body text-muted-foreground">HRV (ms)</p>
        </div>
        <div className="text-center">
          <Heart size={14} className="mx-auto mb-0.5 text-rose-400" />
          <p className="font-display text-lg text-rose-400">{latest?.resting_hr ?? "—"}</p>
          <p className="text-[8px] font-body text-muted-foreground">REST HR</p>
        </div>
        {garminConnected && (
          <div className="text-center">
            <Battery size={14} className={`mx-auto mb-0.5 ${bodyBatteryColor(latestBodyBattery)}`} />
            <p className={`font-display text-lg ${bodyBatteryColor(latestBodyBattery)}`}>
              {latestBodyBattery ?? "—"}
            </p>
            <p className="text-[8px] font-body text-muted-foreground">BODY BATTERY</p>
            <span className="text-[7px] font-display text-muted-foreground bg-muted px-1 rounded">GARMIN</span>
          </div>
        )}
      </div>

      {/* 7-day chart */}
      {data.length > 0 && (
        <div className="h-32 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="recovery" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} name="Recovery" connectNulls />
              <Line type="monotone" dataKey="hrv" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="HRV" connectNulls />
              <Line type="monotone" dataKey="sleep" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} name="Sleep" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Readiness banner */}
      <div className={`bg-muted/30 rounded-lg px-3 py-2 ${readiness.color}`}>
        <p className="font-body text-xs">{readiness.text}</p>
      </div>
    </div>
  );
};

export default HealthDataCard;
