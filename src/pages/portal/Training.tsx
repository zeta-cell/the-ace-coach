import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Play, Clock, Layers, CalendarDays, MapPin, Save, Trash2, Plus, X, Video,
  GripVertical, Minus,
} from "lucide-react";
import {
  format, startOfWeek, addDays, isSameDay, parseISO, isValid,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday,
} from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import TrainingDayInfo from "@/components/portal/TrainingDayInfo";
import TrainingBlocksPanel from "@/components/portal/TrainingBlocksPanel";
import CoachVideoModal from "@/components/portal/CoachVideoModal";
import type { BlockPlanItem, ModuleItem as BlockModuleItem } from "@/types/training";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  warm_up: "bg-yellow-500", padel_drill: "bg-cyan-500", footwork: "bg-blue-500",
  fitness: "bg-orange-500", strength: "bg-orange-600", mental: "bg-purple-500",
  recovery: "bg-green-500", cool_down: "bg-teal-500", nutrition: "bg-lime-500",
  video: "bg-pink-500",
};

interface PlanItem {
  id: string;
  order_index: number;
  is_completed: boolean;
  completed_at: string | null;
  coach_note: string | null;
  module: {
    id: string; title: string; category: string; duration_minutes: number;
    description: string | null; instructions: string | null; video_url: string | null;
    coach_video_url?: string | null;
  };
}

const parseDateParam = (value: string | null) => {
  if (!value) return new Date();
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date();
};

const Training = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const playerParam = searchParams.get("player");

  const isCoachOrAdmin = role === "admin" || role === "coach";
  const isCoachViewingPlayer = isCoachOrAdmin && !!playerParam;
  const targetPlayerId = isCoachOrAdmin ? (playerParam || user?.id) : user?.id;

  const [selectedDay, setSelectedDay] = useState(() => parseDateParam(dateParam));
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [planNotes, setPlanNotes] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Coach editing state
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  // Blocks panel
  const [showBlocksPanel, setShowBlocksPanel] = useState(false);
  const [modules, setModules] = useState<BlockModuleItem[]>([]);

  // Month calendar
  const [showMonthCal, setShowMonthCal] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [planDates, setPlanDates] = useState<Set<string>>(new Set());

  // Save as block
  const [showSaveBlock, setShowSaveBlock] = useState(false);
  const [blockTitle, setBlockTitle] = useState("");
  const [blockGoal, setBlockGoal] = useState("Technique");

  // Coach video modal
  const [coachVideoOpen, setCoachVideoOpen] = useState(false);
  const [coachVideoUrl, setCoachVideoUrl] = useState("");
  const [coachVideoTitle, setCoachVideoTitle] = useState("");

  const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => { setSelectedDay(parseDateParam(dateParam)); }, [dateParam]);
  useEffect(() => { if (targetPlayerId) fetchDayPlan(); }, [selectedDay, targetPlayerId]);
  useEffect(() => { if (user && isCoachOrAdmin) fetchModules(); }, [user]);
  useEffect(() => { if (targetPlayerId) fetchPlanDates(); }, [calMonth, targetPlayerId]);

  const fetchModules = async () => {
    if (!user) return;
    const { data } = await supabase.from("modules")
      .select("id, title, category, duration_minutes")
      .or(`created_by.eq.${user.id},is_shared.eq.true`)
      .order("category");
    setModules((data as BlockModuleItem[]) || []);
  };

  const fetchPlanDates = async () => {
    if (!targetPlayerId) return;
    const ms = startOfMonth(calMonth);
    const me = endOfMonth(calMonth);
    const { data } = await supabase.from("player_day_plans")
      .select("plan_date")
      .eq("player_id", targetPlayerId)
      .gte("plan_date", format(ms, "yyyy-MM-dd"))
      .lte("plan_date", format(me, "yyyy-MM-dd"));
    setPlanDates(new Set(data?.map(d => d.plan_date) || []));
  };

  const fetchDayPlan = async () => {
    if (!targetPlayerId) return;
    setLoading(true);
    const dayStr = format(selectedDay, "yyyy-MM-dd");

    const { data: plan } = await supabase
      .from("player_day_plans")
      .select("id, notes, start_time, end_time, location_name")
      .eq("player_id", targetPlayerId)
      .eq("plan_date", dayStr)
      .maybeSingle();

    if (!plan) {
      setPlanItems([]); setPlanNotes(""); setCurrentPlanId(null);
      setEditStartTime(""); setEditEndTime(""); setEditLocation("");
      setLoading(false);
      return;
    }

    setCurrentPlanId(plan.id);
    setPlanNotes(plan.notes || "");
    setEditStartTime(plan.start_time || "");
    setEditEndTime(plan.end_time || "");
    setEditLocation(plan.location_name || "");

    const { data: items } = await supabase
      .from("player_day_plan_items")
      .select("id, order_index, is_completed, completed_at, coach_note, module_id")
      .eq("plan_id", plan.id)
      .order("order_index");

    const moduleIds = items?.map((i) => i.module_id) || [];
    const { data: mods } = await supabase
      .from("modules")
      .select("id, title, category, duration_minutes, description, instructions, video_url, coach_video_url")
      .in("id", moduleIds.length > 0 ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

    const moduleMap = new Map(mods?.map((m: any) => [m.id, m]) || []);
    setPlanItems(
      (items || []).map((item) => ({
        ...item,
        module: moduleMap.get(item.module_id) || {
          id: item.module_id, title: "Unknown", category: "", duration_minutes: 0,
          description: null, instructions: null, video_url: null, coach_video_url: null,
        },
      }))
    );
    setLoading(false);
  };

  const markComplete = async (itemId: string) => {
    await supabase.from("player_day_plan_items")
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", itemId);
    setPlanItems((prev) =>
      prev.map((item) => item.id === itemId ? { ...item, is_completed: true, completed_at: new Date().toISOString() } : item)
    );
    if (user) {
      await supabase.rpc('award_xp', {
        p_user_id: user.id, p_amount: 25, p_event_type: 'session_complete',
        p_description: 'Completed a training session',
      });
      await supabase.rpc('update_streak', { p_user_id: user.id });
      await supabase.rpc('increment_raffle_tickets', { p_user_id: user.id });
      const completedItem = planItems.find(item => item.id === itemId);
      const durationMinutes = completedItem?.module?.duration_minutes || 0;
      await supabase.rpc('increment_session_stats', { p_user_id: user.id, p_minutes: durationMinutes });
    }
  };

  /* ── Coach actions ── */

  const handleApplyBlock = async (blockItems: BlockPlanItem[]) => {
    if (!targetPlayerId || !user) return;
    const dayStr = format(selectedDay, "yyyy-MM-dd");
    let planId = currentPlanId;

    if (!planId) {
      const { data: newPlan } = await supabase.from("player_day_plans")
        .insert({ player_id: targetPlayerId, coach_id: user.id, plan_date: dayStr, notes: "" })
        .select("id").single();
      if (!newPlan) { toast.error("Failed to create plan"); return; }
      planId = newPlan.id;
      setCurrentPlanId(planId);
    }

    const existingMax = planItems.length > 0
      ? Math.max(...planItems.map(i => i.order_index)) + 1 : 0;

    const newItems = blockItems.map((bi, idx) => ({
      plan_id: planId!,
      module_id: bi.module.id,
      order_index: existingMax + idx,
      coach_note: bi.coach_note || null,
      block_id: 'block_id' in bi ? (bi as any).block_id : null,
    }));

    await supabase.from("player_day_plan_items").insert(newItems);
    setShowBlocksPanel(false);
    fetchDayPlan();
  };

  const handleSavePlan = async () => {
    if (!currentPlanId) return;
    setSavingPlan(true);
    await supabase.from("player_day_plans").update({
      start_time: editStartTime || null,
      end_time: editEndTime || null,
      location_name: editLocation || null,
      notes: planNotes || null,
    }).eq("id", currentPlanId);
    toast.success("Training day saved!");
    setSavingPlan(false);
  };

  const handleCancelDay = async () => {
    if (!currentPlanId || !confirm("Delete this entire training day?")) return;
    await supabase.from("player_day_plan_items").delete().eq("plan_id", currentPlanId);
    await supabase.from("player_day_plans").delete().eq("id", currentPlanId);
    toast.success("Training day removed");
    setCurrentPlanId(null);
    setPlanItems([]);
    setPlanNotes("");
    setEditStartTime(""); setEditEndTime(""); setEditLocation("");
  };

  const handleSaveAsBlock = async () => {
    if (!user || planItems.length === 0 || !blockTitle.trim()) {
      toast.error("Add a title and at least one module"); return;
    }
    await supabase.from("training_blocks").insert({
      coach_id: user.id, title: blockTitle.trim(), goal: blockGoal,
      category: "custom", description: `${planItems.length} modules`,
      module_ids: planItems.map(i => i.module.id),
      module_durations: planItems.map(i => i.module.duration_minutes),
      module_notes: planItems.map(i => i.coach_note || ""),
      is_system: false,
    });
    toast.success("Saved as training block!");
    setShowSaveBlock(false); setBlockTitle(""); setBlockGoal("Technique");
    setShowBlocksPanel(false);
  };

  /* ── Coach reorder ── */
  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= planItems.length) return;

    const updated = [...planItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);

    // Update order_index locally
    const reordered = updated.map((item, i) => ({ ...item, order_index: i }));
    setPlanItems(reordered);

    // Persist all order changes
    for (const item of reordered) {
      await supabase.from("player_day_plan_items")
        .update({ order_index: item.order_index })
        .eq("id", item.id);
    }
  };

  /* ── Coach remove item ── */
  const handleRemoveItem = async (itemId: string) => {
    await supabase.from("player_day_plan_items").delete().eq("id", itemId);
    const remaining = planItems.filter(i => i.id !== itemId);
    // Re-index
    const reordered = remaining.map((item, i) => ({ ...item, order_index: i }));
    setPlanItems(reordered);
    for (const item of reordered) {
      await supabase.from("player_day_plan_items")
        .update({ order_index: item.order_index })
        .eq("id", item.id);
    }
    toast.success("Module removed");
    // If no items left, clean up the plan
    if (reordered.length === 0 && currentPlanId) {
      await supabase.from("player_day_plans").delete().eq("id", currentPlanId);
      setCurrentPlanId(null);
      setPlanNotes("");
    }
  };

  const totalDuration = planItems.reduce((sum, i) => sum + i.module.duration_minutes, 0);

  // Month calendar
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: addDays(endOfMonth(calMonth), 6 - endOfMonth(calMonth).getDay()),
  });

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        {isCoachViewingPlayer && (
          <button
            onClick={() => navigate(`/coach/players/${playerParam}`)}
            className="inline-flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
          >
            <ChevronLeft size={16} /> Back to Player Profile
          </button>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-3xl text-foreground">TRAINING</h1>
          <div className="flex items-center gap-2">
            {isCoachOrAdmin && (
              <button
                onClick={() => setShowBlocksPanel(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-display text-[10px] tracking-wider transition-colors"
              >
                <Layers size={14} /> BLOCKS
              </button>
            )}
            <button
              onClick={() => setShowMonthCal(!showMonthCal)}
              className={`p-2 rounded-lg border transition-colors ${showMonthCal ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            >
              <CalendarDays size={16} />
            </button>
          </div>
        </div>

        {/* Week strip */}
        <div className="flex gap-2 mb-4">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const today = isSameDay(day, new Date());
            const hasPlan = planDates.has(format(day, "yyyy-MM-dd"));
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                className={`flex-1 py-2 rounded-lg text-center transition-colors relative ${
                  isSelected ? "bg-primary text-primary-foreground"
                    : today ? "bg-secondary text-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}>
                <span className="font-display text-xs block">{format(day, "EEE")}</span>
                <span className="font-body text-xs">{format(day, "d")}</span>
                {hasPlan && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Month calendar (toggleable) */}
        <AnimatePresence>
          {showMonthCal && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-1 rounded hover:bg-secondary"><ChevronLeft size={16} /></button>
                  <span className="font-display text-xs tracking-wider text-foreground">{format(calMonth, "MMMM yyyy").toUpperCase()}</span>
                  <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-1 rounded hover:bg-secondary"><ChevronRight size={16} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["M","T","W","T","F","S","S"].map((d,i) => (
                    <div key={i} className="text-center font-display text-[9px] tracking-wider text-muted-foreground py-0.5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const inMonth = isSameMonth(day, calMonth);
                    const selected = isSameDay(day, selectedDay);
                    const hasPlan = planDates.has(dateStr);
                    return (
                      <button key={dateStr} onClick={() => { setSelectedDay(day); setShowMonthCal(false); }}
                        className={`py-1.5 rounded-lg text-xs font-body relative transition-colors ${!inMonth ? "opacity-30" : ""} ${selected ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}>
                        {format(day, "d")}
                        {hasPlan && !selected && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Training Day Info Card (player view) */}
        {targetPlayerId && !isCoachOrAdmin && (
          <div className="mb-6">
            <TrainingDayInfo playerId={targetPlayerId} date={format(selectedDay, "yyyy-MM-dd")} />
          </div>
        )}

        {/* Coach: editable session info */}
        {isCoachOrAdmin && planItems.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
            <h2 className="font-display text-[10px] tracking-wider text-muted-foreground">SESSION INFO</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-display text-[9px] tracking-wider text-muted-foreground block mb-1">
                  <MapPin size={10} className="inline mr-1" />LOCATION
                </label>
                <input value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Training venue..."
                  className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="font-display text-[9px] tracking-wider text-muted-foreground block mb-1">
                  <Clock size={10} className="inline mr-1" />START
                </label>
                <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="font-display text-[9px] tracking-wider text-muted-foreground block mb-1">
                  <Clock size={10} className="inline mr-1" />END
                </label>
                <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSavePlan} disabled={savingPlan}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                <Save size={12} /> {savingPlan ? "SAVING..." : "SAVE TRAINING DAY"}
              </button>
              <button onClick={() => setShowSaveBlock(true)}
                className="py-2 px-3 rounded-lg border border-border text-muted-foreground font-display text-[10px] tracking-wider hover:text-foreground hover:border-primary/40 transition-colors">
                <Layers size={12} />
              </button>
              <button onClick={handleCancelDay}
                className="py-2 px-3 rounded-lg border border-destructive/30 text-destructive font-display text-[10px] tracking-wider hover:bg-destructive/10 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Empty state with coach actions */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : planItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-display text-xl text-muted-foreground">NO PLAN FOR THIS DAY</p>
            <p className="font-body text-sm text-muted-foreground mt-2">
              {isCoachOrAdmin ? "Add modules using training blocks." : "Your coach hasn't assigned a plan yet."}
            </p>
            {isCoachOrAdmin && (
              <button onClick={() => setShowBlocksPanel(true)}
                className="mt-4 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5">
                <Layers size={14} /> USE BLOCK OR MODULES
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Coach builder header */}
            {isCoachOrAdmin && (
              <div className="flex items-center justify-between mb-1">
                <p className="font-display text-[10px] tracking-wider text-muted-foreground">
                  WORKOUT · {planItems.length} MODULE{planItems.length !== 1 ? "S" : ""} · {totalDuration}MIN
                </p>
                <button onClick={() => setShowBlocksPanel(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-[9px] tracking-wider hover:bg-primary/90 transition-colors">
                  <Plus size={11} /> ADD
                </button>
              </div>
            )}

            {planItems.map((item, index) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="flex">
                  <div className={`w-1 ${CATEGORY_COLORS[item.module.category] || "bg-muted"}`} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      {/* Coach reorder controls */}
                      {isCoachOrAdmin && (
                        <div className="flex flex-col gap-0.5 pt-1 shrink-0">
                          <button
                            onClick={() => handleMoveItem(index, "up")}
                            disabled={index === 0}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMoveItem(index, "down")}
                            disabled={index === planItems.length - 1}
                            className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-body text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                            {item.module.category.replace("_", " ")}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground text-xs font-body">
                            <Clock size={12} /> {item.module.duration_minutes} min
                          </span>
                        </div>
                        <h3 className="font-display text-lg text-foreground">{item.module.title}</h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCoachOrAdmin && (
                          <button onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove module"
                          >
                            <Minus size={14} />
                          </button>
                        )}
                        {!isCoachOrAdmin && (
                          !item.is_completed ? (
                            <button onClick={() => markComplete(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors">
                              COMPLETE
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-green-500 font-body text-xs">
                              <Check size={14} /> Done
                            </span>
                          )
                        )}
                        <button onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                          {expandedItem === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {expandedItem === item.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 pt-3 border-t border-border">
                        {item.module.description && (
                          <p className="text-sm font-body text-muted-foreground mb-3">{item.module.description}</p>
                        )}
                        {item.module.instructions && (
                          <div className="text-sm font-body text-foreground mb-3 whitespace-pre-wrap">{item.module.instructions}</div>
                        )}
                        {item.module.video_url && (
                          <div className="aspect-video rounded-lg overflow-hidden mb-3">
                            <iframe
                              src={item.module.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                              className="w-full h-full" allowFullScreen loading="lazy" title={item.module.title} />
                          </div>
                        )}
                         {item.coach_note && (
                           <div className="bg-secondary rounded-lg p-3 mt-2">
                             <p className="text-xs font-display tracking-wider text-muted-foreground mb-1">COACH NOTE</p>
                             <p className="text-sm font-body text-foreground">{item.coach_note}</p>
                           </div>
                         )}
                         {(item.module as any).coach_video_url && (
                           <button
                             onClick={() => {
                               setCoachVideoUrl((item.module as any).coach_video_url);
                               setCoachVideoTitle(item.module.title);
                               setCoachVideoOpen(true);
                             }}
                             className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary font-display text-[10px] tracking-wider hover:bg-primary/20 transition-colors"
                           >
                             <Video size={14} /> WATCH COACH DEMO
                           </button>
                         )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="text-center pt-4">
              <p className="text-xs font-body text-muted-foreground">
                Total: {totalDuration} minutes · {planItems.filter((i) => i.is_completed).length}/{planItems.length} completed
              </p>
            </div>

            {/* Coach: add more modules button */}
            {isCoachOrAdmin && (
              <button onClick={() => setShowBlocksPanel(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground font-display text-[10px] tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                <Plus size={12} /> ADD MORE MODULES FROM BLOCKS
              </button>
            )}
          </div>
        )}
      </div>

      {/* Blocks Panel (slide-in) */}
      {isCoachOrAdmin && (
        <TrainingBlocksPanel
          isOpen={showBlocksPanel}
          onClose={() => setShowBlocksPanel(false)}
          onApplyBlock={handleApplyBlock}
          onSaveAsBlock={planItems.length > 0 ? () => setShowSaveBlock(true) : null}
          modules={modules}
        />
      )}

      {/* Save as block dialog */}
      <AnimatePresence>
        {showSaveBlock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 z-50" onClick={() => setShowSaveBlock(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border rounded-2xl p-5 z-50 space-y-4">
              <h3 className="font-display text-sm tracking-wider text-foreground">SAVE AS TRAINING BLOCK</h3>
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground">BLOCK TITLE *</label>
                <input value={blockTitle} onChange={(e) => setBlockTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground">GOAL</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["Technique","Fitness","Footwork","Mental","Recovery","Warm Up","Match Preparation"].map(g => (
                    <button key={g} onClick={() => setBlockGoal(g)}
                      className={`px-2.5 py-1 rounded-lg font-display text-[9px] tracking-wider transition-colors ${
                        blockGoal === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}>{g.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-body text-muted-foreground">{planItems.length} modules · {totalDuration} min</p>
              <div className="flex gap-2">
                <button onClick={() => setShowSaveBlock(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-muted-foreground font-display text-[10px] tracking-wider">CANCEL</button>
                <button onClick={handleSaveAsBlock} disabled={!blockTitle.trim()}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider disabled:opacity-50">SAVE BLOCK</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CoachVideoModal
        open={coachVideoOpen}
        onClose={() => setCoachVideoOpen(false)}
        videoUrl={coachVideoUrl}
        moduleTitle={coachVideoTitle}
      />
    </PortalLayout>
  );
};

export default Training;
