import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeature } from "@/hooks/useFeatureFlags";
import { CalendarDays, MessageSquare, UserCheck, Clock } from "lucide-react";

interface CoachEntry {
  coach_id: string;
  full_name: string;
  avatar_url: string | null;
  slug: string | null;
  package_count: number;
  cheapest?: { price: number; currency: string } | null;
}

/** Shows the player's assigned coach(es) with a direct booking entry point. */
const MyCoachCard = () => {
  const { user } = useAuth();
  const bookingsEnabled = useFeature("bookings");
  const messagingEnabled = useFeature("messaging");
  const [coaches, setCoaches] = useState<CoachEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: assignments } = await supabase
        .from("coach_player_assignments")
        .select("coach_id")
        .eq("player_id", user.id);

      const ids = [...new Set((assignments || []).map((a) => a.coach_id))];
      if (ids.length === 0) {
        setCoaches([]);
        setLoading(false);
        return;
      }

      const [profilesRes, coachProfilesRes, pkgsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids),
        supabase.from("coach_profiles").select("user_id, profile_slug").in("user_id", ids),
        supabase
          .from("coach_packages")
          .select("coach_id, price_per_session, currency, is_active")
          .in("coach_id", ids)
          .eq("is_active", true),
      ]);

      const slugMap = new Map((coachProfilesRes.data || []).map((c) => [c.user_id, c.profile_slug]));

      setCoaches(
        ids.map((id) => {
          const p = (profilesRes.data || []).find((x) => x.user_id === id);
          const pkgs = (pkgsRes.data || []).filter((x) => x.coach_id === id);
          const cheapest = pkgs.length
            ? pkgs.reduce((min, x) => (Number(x.price_per_session) < Number(min.price_per_session) ? x : min))
            : null;
          return {
            coach_id: id,
            full_name: p?.full_name || "Coach",
            avatar_url: p?.avatar_url || null,
            slug: slugMap.get(id) || null,
            package_count: pkgs.length,
            cheapest: cheapest
              ? { price: Number(cheapest.price_per_session), currency: cheapest.currency || "EUR" }
              : null,
          };
        })
      );
      setLoading(false);
    })();
  }, [user]);

  if (loading || coaches.length === 0) return null;

  const symbol = (c: string) => (c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : c);

  return (
    <div className="mb-6">
      <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">MY COACH</h3>
      <div className="space-y-3">
        {coaches.map((c) => (
          <div key={c.coach_id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0 border border-border">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt={c.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-primary">
                  {c.full_name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-body text-sm text-foreground truncate">{c.full_name}</p>
              <p className="font-body text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                {c.package_count > 0 ? (
                  <>
                    <Clock size={11} className="text-primary" />
                    {c.package_count} session {c.package_count === 1 ? "option" : "options"}
                    {c.cheapest && ` · from ${symbol(c.cheapest.currency)}${c.cheapest.price}`}
                  </>
                ) : (
                  <>
                    <UserCheck size={11} className="text-emerald-500" /> Your coach hasn't published sessions yet
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {messagingEnabled && (
                <Link
                  to="/messages"
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Message ${c.full_name}`}
                >
                  <MessageSquare size={16} />
                </Link>
              )}
              {bookingsEnabled && c.package_count > 0 && (
                <Link
                  to={`/book/${c.slug || c.coach_id}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:bg-primary/90 transition-colors"
                >
                  <CalendarDays size={14} /> BOOK
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCoachCard;
