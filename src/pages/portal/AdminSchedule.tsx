import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, startOfWeek, endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Coach {
  user_id: string;
  full_name: string;
}

interface PlanSummary {
  coach_id: string;
  plan_date: string;
  player_count: number;
  player_names: string[];
  player_ids: string[];
  start_time: string | null;
  end_time: string | null;
}

const COACH_COLORS = [
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "bg-green-500/20 text-green-400 border-green-500/30",
  "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
];

const formatTime = (t: string | null) => {
  if (!t) return null;
  return t.slice(0, 5); // "HH:MM"
};

const AdminSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user, currentMonth]);

  const fetchData = async () => {
    setLoading(true);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "coach");

    const coachIds = roles?.map(r => r.user_id) || [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", coachIds);

    setCoaches(profiles || []);

    if (coachIds.length === 0) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const { data: dayPlans } = await supabase
      .from("player_day_plans")
      .select("coach_id, player_id, plan_date, start_time, end_time")
      .in("coach_id", coachIds)
      .gte("plan_date", start)
      .lte("plan_date", end);

    if (!dayPlans || dayPlans.length === 0) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const playerIds = [...new Set(dayPlans.map(p => p.player_id))];
    const { data: playerProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", playerIds);

    const nameMap = new Map(playerProfiles?.map(p => [p.user_id, p.full_name]) || []);

    const grouped = new Map<string, PlanSummary>();
    dayPlans.forEach((plan: any) => {
      const key = `${plan.coach_id}__${plan.plan_date}__${plan.start_time || "notime"}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          coach_id: plan.coach_id,
          plan_date: plan.plan_date,
          player_count: 0,
          player_names: [],
          player_ids: [],
          start_time: plan.start_time || null,
          end_time: plan.end_time || null,
        });
      }
      const entry = grouped.get(key)!;
      entry.player_count++;
      const name = nameMap.get(plan.player_id);
      if (name) entry.player_names.push(name.split(" ")[0]);
      entry.player_ids.push(plan.player_id);
    });

    setPlans(Array.from(grouped.values()));
    setLoading(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getPlansForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return plans
      .filter(p =>
        p.plan_date === dateStr &&
        (selectedCoachId === "all" || p.coach_id === selectedCoachId)
      )
      .sort((a, b) => (a.start_time || "99:99").localeCompare(b.start_time || "99:99"));
  };

  const getCoachColor = (coachId: string) => {
    const idx = coaches.findIndex(c => c.user_id === coachId);
    return COACH_COLORS[idx % COACH_COLORS.length];
  };

  const selectedDayPlans = selectedDay
    ? plans
        .filter(p =>
          p.plan_date === selectedDay &&
          (selectedCoachId === "all" || p.coach_id === selectedCoachId)
        )
        .sort((a, b) => (a.start_time || "99:99").localeCompare(b.start_time || "99:99"))
    : [];

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-wider">
            COACH SCHEDULE
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-display text-sm tracking-wider text-foreground min-w-[160px] text-center">
              {format(currentMonth, "MMMM yyyy").toUpperCase()}
            </span>
            <button
              onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Coach filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCoachId("all")}
            className={`px-3 py-1.5 rounded-lg font-display text-xs tracking-wider transition-colors ${
              selectedCoachId === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            ALL COACHES
          </button>
          {coaches.map((coach, i) => (
            <button
              key={coach.user_id}
              onClick={() => setSelectedCoachId(selectedCoachId === coach.user_id ? "all" : coach.user_id)}
              className={`px-3 py-1.5 rounded-lg font-display text-xs tracking-wider border transition-colors ${
                selectedCoachId === coach.user_id
                  ? COACH_COLORS[i % COACH_COLORS.length]
                  : "bg-card border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {coach.full_name.split(" ")[0].toUpperCase()}
            </button>
          ))}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
            <div key={d} className="text-center font-display text-[10px] tracking-wider text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayPlans = getPlansForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const isSelected = selectedDay === dateStr;
            const isFree = dayPlans.length === 0;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`
                  min-h-[90px] p-2 rounded-xl border cursor-pointer transition-all
                  ${!isCurrentMonth ? "opacity-25" : ""}
                  ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}
                  ${today ? "ring-1 ring-primary/50" : ""}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-display ${today ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {isFree && isCurrentMonth && (
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                  )}
                </div>

                <div className="space-y-0.5">
                  {dayPlans.slice(0, 3).map((plan, i) => (
                    <div key={i} className={`text-[9px] font-body truncate px-1 rounded ${getCoachColor(plan.coach_id)}`}>
                      <span className="opacity-70">
                        {formatTime(plan.start_time) || "No time"}{" "}
                      </span>
                      {coaches.find(c => c.user_id === plan.coach_id)?.full_name.split(" ")[0]}
                      {plan.player_count > 1 ? ` ×${plan.player_count}` : `: ${plan.player_names[0] || ""}`}
                    </div>
                  ))}
                  {dayPlans.length > 3 && (
                    <p className="text-[9px] text-primary font-body">+{dayPlans.length - 3}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected day breakdown */}
        {selectedDay && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-display text-xs tracking-wider text-foreground">
              {format(new Date(selectedDay + "T00:00:00"), "EEEE, d MMMM yyyy").toUpperCase()}
            </h3>

            {selectedDayPlans.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-display text-foreground mb-1">
                  {selectedCoachId === "all" ? "All coaches are free" : "Coach is free"} on this day
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-green-500 font-body">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Available slot
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Timeline view */}
                <div className="space-y-2">
                  {selectedDayPlans.map((plan, i) => {
                    const coach = coaches.find(c => c.user_id === plan.coach_id);
                    const timeStr = formatTime(plan.start_time);
                    const endStr = formatTime(plan.end_time);

                    return (
                      <div key={i} className={`p-3 rounded-lg border ${getCoachColor(plan.coach_id)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-1">
                                <Clock size={12} className="opacity-60" />
                                <span className="font-display text-xs tracking-wider">
                                  {timeStr || "No time"} – {endStr || "No time"}
                                </span>
                              </div>
                            <button
                              onClick={() => navigate(`/admin/schedule/coach/${plan.coach_id}`)}
                              className="font-display text-sm tracking-wider hover:text-primary transition-colors flex items-center gap-1"
                            >
                              {coach?.full_name}
                              <ExternalLink size={10} className="opacity-50" />
                            </button>
                            <div className="text-xs font-body opacity-80 flex flex-wrap items-center gap-1 mt-0.5">
                              <span>Training:</span>
                              {plan.player_names.map((name, j) => (
                                <button
                                  key={j}
                                  onClick={() => navigate(`/admin/users`)}
                                  className="underline underline-offset-2 hover:text-primary transition-colors"
                                >
                                  {name}{j < plan.player_names.length - 1 ? "," : ""}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg">{plan.player_count}</p>
                            <p className="text-[10px] font-body opacity-70">
                              player{plan.player_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Free coaches */}
                {selectedCoachId === "all" && (() => {
                  const bookedCoachIds = new Set(selectedDayPlans.map(p => p.coach_id));
                  const freeCoaches = coaches.filter(c => !bookedCoachIds.has(c.user_id));
                  if (freeCoaches.length === 0) return null;
                  return (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] font-display tracking-wider text-muted-foreground mb-2">FREE COACHES:</p>
                      <div className="flex flex-wrap gap-2">
                        {freeCoaches.map(c => (
                          <span key={c.user_id} className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-body border border-green-500/30">
                            {c.full_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default AdminSchedule;
