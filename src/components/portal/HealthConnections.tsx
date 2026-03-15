import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, RefreshCw, Unplug, Wifi } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface HealthConnection {
  provider: string;
  is_connected: boolean;
  last_synced_at: string | null;
}

const PROVIDERS = [
  { key: "whoop", name: "WHOOP", color: "#00F19F", initials: "W", metrics: ["Recovery", "Strain", "HRV"], fn: "whoop-oauth" },
  { key: "oura", name: "Oura Ring", color: "#6B63F6", initials: "O", metrics: ["Readiness", "Sleep", "HRV"], fn: "oura-oauth" },
  { key: "polar", name: "Polar", color: "#D0112B", initials: "P", metrics: ["Training", "Calories", "HR"], fn: "polar-oauth" },
  { key: "garmin", name: "Garmin", color: "#007CC3", initials: "G", metrics: ["Body Battery", "Steps", "HR"], fn: "garmin-oauth" },
  { key: "apple_health", name: "Apple Health", color: "#FF2D55", initials: "AH", metrics: ["Steps", "Calories", "Sleep"], fn: null },
];

const HealthConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<HealthConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchConnections();
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;
    const { data } = await supabase.from("health_connections")
      .select("provider, is_connected, last_synced_at")
      .eq("user_id", user.id);
    setConnections(data || []);
    setLoading(false);
  };

  const handleConnect = async (provider: typeof PROVIDERS[0]) => {
    if (!user || !provider.fn) return;
    setConnecting(provider.key);
    try {
      const { data, error } = await supabase.functions.invoke(provider.fn, {
        body: { action: "connect", user_id: user.id },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(`Failed to connect ${provider.name}`, { description: err.message });
    }
    setConnecting(null);
  };

  const handleSync = async (provider: typeof PROVIDERS[0]) => {
    if (!user || !provider.fn) return;
    setSyncing(provider.key);
    try {
      const { data, error } = await supabase.functions.invoke(provider.fn, {
        body: { action: "sync", user_id: user.id },
      });
      if (error) throw error;
      toast.success(`${provider.name} synced`, { description: `${data?.synced || 0} records updated` });
      fetchConnections();
    } catch (err: any) {
      toast.error(`Sync failed`, { description: err.message });
    }
    setSyncing(null);
  };

  const handleDisconnect = async (providerKey: string) => {
    if (!user) return;
    await supabase.from("health_connections")
      .update({ is_connected: false, access_token: null, refresh_token: null })
      .eq("user_id", user.id).eq("provider", providerKey);
    toast.success("Device disconnected");
    fetchConnections();
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">CONNECTED DEVICES</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PROVIDERS.map((p) => {
          const conn = connections.find((c) => c.provider === p.key);
          const isConnected = conn?.is_connected;
          const isApple = p.key === "apple_health";

          return (
            <div key={p.key} className="border border-border rounded-xl p-3 text-center space-y-2">
              <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-white font-display text-xs" style={{ backgroundColor: p.color }}>
                {p.initials}
              </div>
              <p className="font-display text-xs text-foreground">{p.name}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {p.metrics.map((m) => (
                  <span key={m} className="text-[8px] font-body text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">{m}</span>
                ))}
              </div>

              {isApple ? (
                <span className="inline-block text-[9px] font-display text-muted-foreground bg-muted px-2 py-0.5 rounded-full">COMING SOON</span>
              ) : isConnected ? (
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[9px] font-display text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <Wifi size={8} /> CONNECTED
                  </span>
                  {conn?.last_synced_at && (
                    <p className="text-[8px] font-body text-muted-foreground">
                      Synced {formatDistanceToNow(new Date(conn.last_synced_at), { addSuffix: true })}
                    </p>
                  )}
                  <div className="flex gap-1">
                    <button onClick={() => handleSync(p)} disabled={syncing === p.key}
                      className="flex-1 text-[8px] font-display py-1 rounded border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                      {syncing === p.key ? <Loader2 size={8} className="animate-spin mx-auto" /> : "SYNC"}
                    </button>
                    <button onClick={() => handleDisconnect(p.key)}
                      className="text-[8px] font-display py-1 px-2 rounded border border-border text-muted-foreground hover:text-destructive transition-colors">
                      <Unplug size={8} />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => handleConnect(p)} disabled={connecting === p.key}
                  className="w-full text-[9px] font-display py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {connecting === p.key ? <Loader2 size={10} className="animate-spin mx-auto" /> : "CONNECT"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HealthConnections;
