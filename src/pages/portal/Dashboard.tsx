import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Play, Calendar, TrendingUp, Flame, CheckCircle } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import TrainingDayInfo from "@/components/portal/TrainingDayInfo";

interface DayPlan {
  id: string;
  plan_date: string;
  notes: string | null;
  items: {
    id: string;
    module_title: string;
    duration_minutes: number;
    is_completed: boolean;
    category: string;
  }[];
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [weekPlans, setWeekPlans] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedDayPlan, setSelectedDayPlan] = useState<DayPlan | null>(null);
  const [stats, setStats] = useState({ sessionsThisWeek: 0, streak: 0, completedModules: 0 });

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;
    const todayStr = format(today, "yyyy-MM-dd");
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

    // Fetch today's plan
    const { data: todayData } = await supabase
      .from("player_day_plans")
      .select("id, plan_date, notes")
      .eq("player_id", user.id)
      .eq("plan_date", todayStr)
      .maybeSingle();

    if (todayData) {
      const { data: items } = await supabase
        .from("player_day_plan_items")
        .select("id, is_completed, coach_note, order_index, module_id")
        .eq("plan_id", todayData.id)
        .order("order_index");

      // Fetch module details for each item
      const moduleIds = items?.map((i) => i.module_id) || [];
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, duration_minutes, category")
        .in("id", moduleIds.length > 0 ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

      const moduleMap = new Map(modules?.map((m) => [m.id, m]) || []);

      setTodayPlan({
        ...todayData,
        items: (items || []).map((item) => {
          const mod = moduleMap.get(item.module_id);
          return {
            id: item.id,
            module_title: mod?.title || "Unknown",
            duration_minutes: mod?.duration_minutes || 0,
            is_completed: item.is_completed,
            category: mod?.category || "",
          };
        }),
      });
    }

    // Fetch week plans dates
    const { data: weekData } = await supabase
      .from("player_day_plans")
      .select("plan_date")
      .eq("player_id", user.id)
      .gte("plan_date", weekStartStr)
      .lte("plan_date", weekEndStr);

    setWeekPlans(weekData?.map((d) => d.plan_date) || []);

    // Stats
    const { data: completedItems } = await supabase
      .from("player_day_plan_items")
      .select("id, plan_id")
      .eq("is_completed", true);

    setStats({
      sessionsThisWeek: weekData?.length || 0,
      streak: 0, // simplified
      completedModules: completedItems?.length || 0,
    });
  };

  const totalDuration = todayPlan?.items.reduce((sum, i) => sum + i.duration_minutes, 0) || 0;
  const firstName = profile?.full_name?.split(" ")[0]?.toUpperCase() || "PLAYER";

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl md:text-4xl text-foreground mb-6"
        >
          WELCOME BACK, {firstName}
        </motion.h1>

        {/* Today's plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl overflow-hidden mb-6"
        >
          <div className="flex">
            <div className="w-1 bg-primary" />
            <div className="flex-1 p-5">
              {todayPlan && todayPlan.items.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-xl text-foreground">TODAY'S TRAINING</h2>
                    <span className="font-body text-xs text-muted-foreground">
                      {todayPlan.items.length} modules · {totalDuration} min
                    </span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mb-4">
                    {todayPlan.items[0]?.module_title}
                    {todayPlan.items.length > 1 && ` + ${todayPlan.items.length - 1} more`}
                  </p>
                  <Link
                    to="/training"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display text-sm tracking-wider px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Play size={16} /> START TRAINING
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl text-foreground mb-2">NO TRAINING TODAY</h2>
                  <p className="font-body text-sm text-muted-foreground">
                    Rest day or your coach hasn't assigned a plan yet. Use this time to recover! 💪
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Week strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">THIS WEEK</h3>
          <div className="flex gap-2">
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const hasPlan = weekPlans.includes(dayStr);
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDay);
              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 py-2 rounded-lg text-center relative transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "bg-secondary text-foreground"
                        : "bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="font-display text-xs block">{format(day, "EEE")}</span>
                  <span className="font-body text-xs">{format(day, "d")}</span>
                  {hasPlan && (
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Calendar size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{stats.sessionsThisWeek}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Sessions</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Flame size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{stats.streak}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Streak</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <CheckCircle size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl text-foreground">{stats.completedModules}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Completed</p>
          </div>
        </motion.div>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;
