import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import PortalLayout from "@/components/portal/PortalLayout";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Sparkles, ToggleLeft } from "lucide-react";

/**
 * Rollout order — the sequence in which features should be switched on as the
 * platform grows. Everything not listed lands in the last phase.
 */
const PHASES: { id: string; title: string; hint: string; keys: string[] }[] = [
  {
    id: "phase1",
    title: "PHASE 1 · LIVE NOW (first customers)",
    hint: "Assessments, player card, coach ↔ player messaging, trainings & events, refer & earn.",
    keys: ["assessments", "player_card", "messaging", "events", "referrals"],
  },
  {
    id: "phase2",
    title: "PHASE 2 · WHEN COACHES SELL (bookings & money)",
    hint: "Turn on once coaches want paid sessions and payouts.",
    keys: ["bookings", "coach_earnings", "player_videos", "coach_crm"],
  },
  {
    id: "phase3",
    title: "PHASE 3 · WHEN THERE IS SUPPLY (discovery)",
    hint: "Only switch on with enough coaches and programs — these open the public website.",
    keys: ["public_nav", "coach_discovery", "marketplace", "coach_marketplace", "club_signup"],
  },
  {
    id: "phase4",
    title: "PHASE 4 · WHEN THERE IS A CROWD (social & extras)",
    hint: "Leaderboards, reward discounts and device integrations.",
    keys: ["community", "rewards_discounts", "connected_devices"],
  },
];

const AdminFeatures = () => {
  const { flags, loading, refresh } = useFeatureFlags();
  const [saving, setSaving] = useState<string | null>(null);

  const update = async (key: string, patch: { is_enabled?: boolean; coming_soon?: boolean }) => {
    setSaving(key);
    const { error } = await supabase.from("feature_flags").update(patch).eq("key", key);
    if (error) toast.error("Could not save", { description: error.message });
    else {
      await refresh();
      toast.success(`${flags[key]?.label || key} updated`);
    }
    setSaving(null);
  };

  const list = Object.values(flags);
  const known = new Set(PHASES.flatMap((p) => p.keys));
  const groups = [
    ...PHASES.map((p) => ({
      ...p,
      items: p.keys.map((k) => flags[k]).filter(Boolean),
    })),
    {
      id: "other",
      title: "OTHER MODULES",
      hint: "Not part of the planned rollout.",
      items: list.filter((f) => !known.has(f.key)),
    },
  ].filter((g) => g.items.length > 0);


  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ToggleLeft className="text-primary" size={24} />
          <h1 className="font-display text-3xl text-foreground">FEATURE CONTROL</h1>
        </div>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Switch platform features on or off for everyone. Admins always keep full access, so you can test
          anything before releasing it.
        </p>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.id}>
                <h2 className="font-display text-xs tracking-wider text-primary mb-1">{g.title}</h2>
                <p className="font-body text-[11px] text-muted-foreground mb-2">{g.hint}</p>
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                  {g.items.map((f) => (

                      <div key={f.key} className="p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-display text-sm text-foreground">{f.label}</p>
                            {f.coming_soon && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-display text-[9px] tracking-wider text-primary">
                                <Sparkles size={9} /> SOON
                              </span>
                            )}
                          </div>
                          {f.description && (
                            <p className="font-body text-xs text-muted-foreground mt-0.5">{f.description}</p>
                          )}
                          <button
                            onClick={() => update(f.key, { coming_soon: !f.coming_soon })}
                            disabled={saving === f.key}
                            className="mt-2 font-body text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {f.coming_soon ? "Remove “coming soon” label" : "Mark as “coming soon”"}
                          </button>
                        </div>
                        <Switch
                          checked={f.is_enabled}
                          disabled={saving === f.key}
                          onCheckedChange={(v) => update(f.key, { is_enabled: v })}
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default AdminFeatures;
