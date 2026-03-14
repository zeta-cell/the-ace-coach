import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, Clock, ChevronRight, Dumbbell } from "lucide-react";
import { format, addDays } from "date-fns";

interface PlanRow {
  id: string;
  plan_date: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  coach_id: string;
  coach_name?: string;
  module_count: number;
}

interface UpcomingScheduleProps {
  playerId: string;
  /** Link prefix for tapping a plan row */
  linkPrefix?: "training" | "coach-plan";
  /** How many days ahead to look (default 14) */
  daysAhead?: number;
  /** Show coach name (useful for player view) */
  showCoach?: boolean;
}

const UpcomingSchedule = ({ playerId, linkPrefix = "training", daysAhead = 14, showCoach = true }: UpcomingScheduleProps) => {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, [playerId]);

  const fetchPlans = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const end = format(addDays(new Date(), daysAhead), "yyyy-MM-dd");

    const { data } = await supabase
      .from("player_day_plans")
      .select("id, plan_date, start_time, end_time, notes, coach_id, player_day_plan_items(id)")
      .eq("player_id", playerId)
      .gte("plan_date", today)
      .lte("plan_date", end)
      .order("plan_date", { ascending: true })
      .limit(10);

    if (!data || data.length === 0) {
      setPlans([]);
      setLoading(false);
      return;
    }

    // Fetch coach names
    const coachIds = [...new Set(data.map((p) => p.coach_id))];
    const { data: coaches } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", coachIds);

    const coachMap = new Map(coaches?.map((c) => [c.user_id, c.full_name]) || []);

    setPlans(
      data.map((p) => ({
        id: p.id,
        plan_date: p.plan_date,
        start_time: p.start_time,
        end_time: p.end_time,
        notes: p.notes,
        coach_id: p.coach_id,
        coach_name: coachMap.get(p.coach_id) || "Coach",
        module_count: (p.player_day_plan_items as any[])?.length || 0,
      }))
    );
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">UPCOMING TRAINING</h2>
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm tracking-wider text-muted-foreground">UPCOMING TRAINING</h2>
        <span className="text-[10px] font-body text-muted-foreground">{plans.length} sessions</span>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground text-center py-4">No upcoming sessions scheduled</p>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => {
            const planLink =
              linkPrefix === "coach-plan"
                ? `/coach/plan/${playerId}`
                : `/training?date=${plan.plan_date}&player=${playerId}`;

            return (
              <Link
                key={plan.id}
                to={planLink}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors group"
              >
                {/* Date block */}
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-body text-primary uppercase">
                    {format(new Date(plan.plan_date + "T00:00:00"), "EEE")}
                  </span>
                  <span className="font-display text-lg text-primary leading-none">
                    {format(new Date(plan.plan_date + "T00:00:00"), "d")}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {plan.start_time && (
                      <span className="flex items-center gap-1 text-xs font-body text-foreground">
                        <Clock size={12} className="text-muted-foreground" />
                        {plan.start_time.slice(0, 5)}
                        {plan.end_time ? ` – ${plan.end_time.slice(0, 5)}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] font-body text-muted-foreground">
                      <Dumbbell size={10} /> {plan.module_count} modules
                    </span>
                    {showCoach && (
                      <span className="text-[10px] font-body text-muted-foreground">
                        · {plan.coach_name}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingSchedule;
