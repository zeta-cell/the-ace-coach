import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Play, Calendar, TrendingUp, Flame, CheckCircle, ShoppingBag, ChevronRight, MessageCircle, UserPlus, User as UserIcon, X } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import TrainingDayInfo from "@/components/portal/TrainingDayInfo";
import UpcomingBookings from "@/components/portal/UpcomingBookings";
import { toast } from "sonner";

interface DayPlan {
  id: string; plan_date: string; notes: string | null;
  items: { id: string; module_title: string; duration_minutes: number; is_completed: boolean; category: string; }[];
}

interface PurchasedProgram {
  id: string; block_id: string; current_week: number;
  title: string; author_name: string | null; author_avatar_url: string | null;
  week_count: number; block_type: string; thumbnail_url: string | null;
  coach_status: "none" | "pending" | "accepted";
  coach_name: string | null; coach_id: string | null; request_id: string | null;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null);
  const [weekPlans, setWeekPlans] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [selectedDayPlan, setSelectedDayPlan] = useState<DayPlan | null>(null);
  const [stats, setStats] = useState({ sessionsThisWeek: 0, streak: 0, completedModules: 0 });
  const [programs, setPrograms] = useState<PurchasedProgram[]>([]);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => { if (user) { fetchPlans(); fetchPrograms(); } }, [user]);

  const fetchPrograms = async () => {
    if (!user) return;
    const { data: purchases } = await supabase.from("block_purchases").select("id, block_id, current_week").eq("buyer_id", user.id).eq("status", "completed");
    if (!purchases || purchases.length === 0) return;
    const blockIds = purchases.map((p) => p.block_id);
    const { data: blocks } = await supabase.from("training_blocks").select("id, title, author_name, author_avatar_url, week_count, block_type, thumbnail_url").in("id", blockIds);
    const blockMap = new Map((blocks as any[])?.map((b) => [b.id, b]) || []);

    // Fetch coach requests for these blocks
    const { data: requests } = await supabase.from("coach_requests").select("id, block_id, coach_id, status").eq("player_id", user.id).in("block_id", blockIds);
    const requestMap = new Map<string, { status: string; coach_id: string; request_id: string }>();
    requests?.forEach((r) => { if (r.block_id) requestMap.set(r.block_id, { status: r.status || "pending", coach_id: r.coach_id, request_id: r.id }); });

    // Fetch coach names
    const coachIds = [...new Set(requests?.map((r) => r.coach_id) || [])];
    const coachNameMap = new Map<string, string>();
    if (coachIds.length > 0) {
      const { data: coachProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", coachIds);
      coachProfiles?.forEach((p) => coachNameMap.set(p.user_id, p.full_name));
    }

    setPrograms(purchases.map((p) => {
      const b = blockMap.get(p.block_id);
      const req = requestMap.get(p.block_id);
      return {
        ...p, title: b?.title || "Program", author_name: b?.author_name, author_avatar_url: b?.author_avatar_url,
        week_count: b?.week_count || 1, block_type: b?.block_type || "session", thumbnail_url: b?.thumbnail_url,
        coach_status: req ? (req.status === "accepted" ? "accepted" : "pending") as any : "none",
        coach_name: req ? coachNameMap.get(req.coach_id) || null : null,
        coach_id: req?.coach_id || null, request_id: req?.request_id || null,
      };
    }));
  };

  const cancelRequest = async (requestId: string) => {
    await supabase.from("coach_requests").update({ status: "cancelled" } as any).eq("id", requestId);
    toast.success("Request cancelled");
    fetchPrograms();
  };

  const fetchPlans = async () => {
    if (!user) return;
    const todayStr = format(today, "yyyy-MM-dd");
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const { data: todayData } = await supabase.from("player_day_plans").select("id, plan_date, notes").eq("player_id", user.id).eq("plan_date", todayStr).maybeSingle();
    if (todayData) {
      const { data: items } = await supabase.from("player_day_plan_items").select("id, is_completed, coach_note, order_index, module_id").eq("plan_id", todayData.id).order("order_index");
      const moduleIds = items?.map((i) => i.module_id) || [];
      const { data: modules } = await supabase.from("modules").select("id, title, duration_minutes, category").in("id", moduleIds.length > 0 ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);
      const moduleMap = new Map(modules?.map((m) => [m.id, m]) || []);
      setTodayPlan({ ...todayData, items: (items || []).map((item) => { const mod = moduleMap.get(item.module_id); return { id: item.id, module_title: mod?.title || "Unknown", duration_minutes: mod?.duration_minutes || 0, is_completed: item.is_completed, category: mod?.category || "" }; }) });
    }
    const { data: weekData } = await supabase.from("player_day_plans").select("plan_date").eq("player_id", user.id).gte("plan_date", weekStartStr).lte("plan_date", weekEndStr);
    setWeekPlans(weekData?.map((d) => d.plan_date) || []);
    const { data: completedItems } = await supabase.from("player_day_plan_items").select("id, plan_id").eq("is_completed", true);
    setStats({ sessionsThisWeek: weekData?.length || 0, streak: 0, completedModules: completedItems?.length || 0 });
  };

  const totalDuration = todayPlan?.items.reduce((sum, i) => sum + i.duration_minutes, 0) || 0;
  const firstName = profile?.full_name?.split(" ")[0]?.toUpperCase() || "PLAYER";

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl md:text-4xl text-foreground mb-6">
          WELCOME BACK, {firstName}
        </motion.h1>

        {/* Today's plan card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="flex">
            <div className="w-1 bg-primary" />
            <div className="flex-1 p-5">
              {todayPlan && todayPlan.items.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-xl text-foreground">TODAY'S TRAINING</h2>
                    <span className="font-body text-xs text-muted-foreground">{todayPlan.items.length} modules · {totalDuration} min</span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mb-4">{todayPlan.items[0]?.module_title}{todayPlan.items.length > 1 && ` + ${todayPlan.items.length - 1} more`}</p>
                  <Link to="/training" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display text-sm tracking-wider px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
                    <Play size={16} /> START TRAINING
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl text-foreground mb-2">NO TRAINING TODAY</h2>
                  <p className="font-body text-sm text-muted-foreground">Rest day or your coach hasn't assigned a plan yet. Use this time to recover! 💪</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Upcoming booked sessions */}
        <UpcomingBookings />

        {/* My Programs */}
        {programs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-6" id="programs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm tracking-wider text-foreground flex items-center gap-2"><ShoppingBag size={16} className="text-primary" /> MY PROGRAMS</h3>
              <Link to="/marketplace" className="text-xs font-body text-primary hover:underline">Browse more</Link>
            </div>
            <div className="space-y-2">
              {programs.map((prog) => {
                const progress = prog.week_count > 1 ? Math.round(((prog.current_week || 1) / prog.week_count) * 100) : 0;
                const status = (prog.current_week || 1) <= 1 ? "NOT STARTED" : (prog.current_week || 1) >= prog.week_count ? "COMPLETED" : "IN PROGRESS";
                return (
                  <div key={prog.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <ShoppingBag size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-foreground truncate">{prog.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-body text-muted-foreground">by {prog.author_name || "ACE"}</span>
                          {prog.week_count > 1 && <span className="text-[9px] font-body text-primary">Week {prog.current_week || 1} of {prog.week_count}</span>}
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-display ${status === "COMPLETED" ? "bg-green-500/20 text-green-400" : status === "IN PROGRESS" ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>{status}</span>
                        </div>
                        {prog.week_count > 1 && (
                          <div className="w-full h-1 bg-muted rounded-full mt-1.5">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                      <Link to="/training" className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                    {/* Coach assignment status */}
                    <div className="mt-3 pt-3 border-t border-border">
                      {prog.coach_status === "accepted" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle size={12} className="text-green-400" /></div>
                          <span className="text-xs font-body text-foreground">Coached by {prog.coach_name}</span>
                          <button onClick={() => navigate(`/messages?to=${prog.coach_id}`)} className="ml-auto px-3 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground font-display text-[9px] tracking-wider flex items-center gap-1">
                            <MessageCircle size={10} /> MESSAGE
                          </button>
                        </div>
                      ) : prog.coach_status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center"><UserIcon size={12} className="text-amber-400" /></div>
                          <span className="text-xs font-body text-muted-foreground">Request pending with {prog.coach_name}</span>
                          <button onClick={() => prog.request_id && cancelRequest(prog.request_id)} className="ml-auto px-3 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground font-display text-[9px] tracking-wider flex items-center gap-1">
                            <X size={10} /> CANCEL
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><UserIcon size={12} className="text-muted-foreground" /></div>
                          <span className="text-xs font-body text-muted-foreground">Doing this alone</span>
                          <Link to="/marketplace" className="ml-auto text-[9px] font-display text-primary hover:underline flex items-center gap-1">
                            <UserPlus size={10} /> FIND A COACH →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Training Day Info */}
        {user && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6"><TrainingDayInfo playerId={user.id} date={format(today, "yyyy-MM-dd")} /></motion.div>}

        {/* Week strip */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">THIS WEEK</h3>
          <div className="flex gap-2">
            {weekDays.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd"); const hasPlan = weekPlans.includes(dayStr);
              const isToday = isSameDay(day, today); const isSelected = isSameDay(day, selectedDay);
              return (
                <button key={dayStr} onClick={() => setSelectedDay(day)}
                  className={`flex-1 py-2 rounded-lg text-center relative transition-colors ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-secondary text-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
                  <span className="font-display text-xs block">{format(day, "EEE")}</span>
                  <span className="font-body text-xs">{format(day, "d")}</span>
                  {hasPlan && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-3 mb-6">
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
