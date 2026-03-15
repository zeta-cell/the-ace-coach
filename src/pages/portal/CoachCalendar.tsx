import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, Link } from "react-router-dom";
import PortalLayout from "@/components/portal/PortalLayout";
import CoachAvailabilityGrid from "@/components/portal/CoachAvailabilityGrid";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, startOfWeek, endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Users, Clock, ArrowLeft, Plus } from "lucide-react";

interface DayPlan {
  plan_date: string;
  player_id: string;
  player_name: string;
  item_count: number;
  start_time: string | null;
  end_time: string | null;
}

interface AssignedPlayer {
  player_id: string;
  full_name: string;
}

const formatTime = (t: string | null) => {
  if (!t) return null;
  return t.slice(0, 5);
};

const CoachCalendar = () => {
  const { user, role } = useAuth();
  const { coachId: paramCoachId } = useParams<{ coachId?: string }>();
  const navigate = useNavigate();

  // If admin is viewing a specific coach, use that ID; otherwise use own
  const isAdminView = role === "admin" && !!paramCoachId;
  const targetCoachId = paramCoachId || user?.id;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string>("");
  const [assignedPlayers, setAssignedPlayers] = useState<AssignedPlayer[]>([]);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);

  useEffect(() => {
    if (targetCoachId) {
      fetchMonthPlans();
      if (!isAdminView) fetchAssignedPlayers();
    }
  }, [targetCoachId, currentMonth]);

  useEffect(() => {
    if (isAdminView && paramCoachId) {
      supabase.from("profiles").select("full_name").eq("user_id", paramCoachId).single()
        .then(({ data }) => setCoachName(data?.full_name || "Coach"));
    }
  }, [isAdminView, paramCoachId]);

  const fetchAssignedPlayers = async () => {
    if (!targetCoachId) return;
    const { data: assignments } = await supabase
      .from("coach_player_assignments")
      .select("player_id")
      .eq("coach_id", targetCoachId);
    const ids = assignments?.map((a) => a.player_id) || [];
    if (ids.length === 0) return;
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", ids);
    setAssignedPlayers(profiles?.map((p) => ({ player_id: p.user_id, full_name: p.full_name })) || []);
  };

  const fetchMonthPlans = async () => {
    if (!targetCoachId) return;
    setLoading(true);

    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const { data: dayPlans } = await supabase
      .from("player_day_plans")
      .select("plan_date, player_id, id, start_time, end_time")
      .eq("coach_id", targetCoachId)
      .gte("plan_date", start)
      .lte("plan_date", end);

    if (!dayPlans || dayPlans.length === 0) {
      setPlans([]);
      setLoading(false);
      return;
    }

    const playerIds = [...new Set(dayPlans.map(p => p.player_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", playerIds);

    const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

    const planIds = dayPlans.map(p => p.id);
    const { data: items } = await supabase
      .from("player_day_plan_items")
      .select("plan_id")
      .in("plan_id", planIds);

    const countMap = new Map<string, number>();
    items?.forEach(item => {
      countMap.set(item.plan_id, (countMap.get(item.plan_id) || 0) + 1);
    });

    const result = dayPlans.map(p => ({
      plan_date: p.plan_date,
      player_id: p.player_id,
      player_name: nameMap.get(p.player_id) || "Unknown",
      item_count: countMap.get(p.id) || 0,
      start_time: p.start_time || null,
      end_time: p.end_time || null,
    }));

    result.sort((a, b) => (a.start_time || "99:99").localeCompare(b.start_time || "99:99"));
    setPlans(result);
    setLoading(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getPlansForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return plans.filter(p => p.plan_date === dateStr);
  };

  const selectedDayPlans = selectedDay
    ? plans.filter(p => p.plan_date === selectedDay)
    : [];

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Availability grid — coach's own view only */}
        {!isAdminView && targetCoachId && (
          <CoachAvailabilityGrid coachId={targetCoachId} />
        )}

        {/* Header */}
        <div className="space-y-4">
          {isAdminView && (
            <Link to="/admin/schedule" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm transition-colors">
              <ArrowLeft size={16} /> Back to Schedule
            </Link>
          )}
          <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-wider">
            {isAdminView ? `${coachName.toUpperCase()}'S SCHEDULE` : "MY SCHEDULE"}
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

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-body text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Has plans
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Free slot
          </div>
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
            const dayPlans = getPlansForDay(day);
            const dateStr = format(day, "yyyy-MM-dd");
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDay === dateStr;
            const hasPlans = dayPlans.length > 0;
            const today = isToday(day);

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`
                  min-h-[80px] p-2 rounded-xl border cursor-pointer transition-all
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}
                  ${today ? "ring-1 ring-primary/50" : ""}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-display ${today ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {hasPlans && <div className="w-2 h-2 rounded-full bg-primary" />}
                  {!hasPlans && isCurrentMonth && <div className="w-2 h-2 rounded-full bg-green-500/50" />}
                </div>

                <div className="space-y-0.5">
                  {dayPlans.slice(0, 3).map((plan, i) => (
                    <div key={i} className="text-[9px] font-body text-muted-foreground truncate">
                      <span className="text-primary/70">{formatTime(plan.start_time) || "—"}</span>{" "}
                      {plan.player_name.split(" ")[0]}
                    </div>
                  ))}
                  {dayPlans.length > 3 && (
                    <div className="text-[9px] font-body text-primary">
                      +{dayPlans.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected day detail — timeline view */}
        {selectedDay && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs tracking-wider text-foreground">
                {format(new Date(selectedDay + "T00:00:00"), "EEEE, d MMMM yyyy").toUpperCase()}
              </h3>
              <span className="text-[10px] font-body text-muted-foreground">
                {selectedDayPlans.length} session{selectedDayPlans.length !== 1 ? "s" : ""}
              </span>
            </div>

            {selectedDayPlans.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <p className="font-display text-sm text-foreground">No plans scheduled</p>
                <p className="text-xs text-muted-foreground font-body">Free slot available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayPlans.map((plan, i) => {
                  const timeStr = formatTime(plan.start_time);
                  const endStr = formatTime(plan.end_time);

                  return (
                    <div
                      key={i}
                      onClick={() => navigate(`/coach/plan/${plan.player_id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors"
                    >
                      {/* Time column */}
                      <div className="flex flex-col items-center min-w-[52px] shrink-0">
                        <span className="text-xs font-display text-primary tracking-wider">
                          {timeStr || "—"}
                        </span>
                        <span className="text-[9px] font-body text-muted-foreground">
                          {endStr || "—"}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-10 bg-border shrink-0" />

                      {/* Player info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-display text-xs">
                            {plan.player_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-display text-foreground truncate">{plan.player_name}</p>
                          <div className="flex items-center gap-1.5">
                            <Clock size={10} className="text-muted-foreground shrink-0" />
                            <span className="text-[10px] font-body text-muted-foreground">
                              {timeStr && endStr ? `${timeStr} – ${endStr}` : "No time set"} · {plan.item_count} module{plan.item_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default CoachCalendar;
