import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Clock, Layers, CalendarDays, MapPin, Save, Trash2, Plus, X, Video,
  Minus, Search, User, Sun, Cloud, CloudRain, CloudSnow, Wind, ExternalLink,
} from "lucide-react";
import {
  format, startOfWeek, addDays, isSameDay, parseISO, isValid,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay,
} from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import TrainingDayInfo from "@/components/portal/TrainingDayInfo";
import CoachVideoModal from "@/components/portal/CoachVideoModal";
import type { ModuleItem as BlockModuleItem } from "@/types/training";
import { toast } from "sonner";

/* ── colour maps ── */
const CATEGORY_COLORS: Record<string, string> = {
  warm_up: "border-l-yellow-500", padel_drill: "border-l-cyan-500", padel: "border-l-cyan-500",
  footwork: "border-l-blue-500", fitness: "border-l-orange-500", strength: "border-l-orange-600",
  mental: "border-l-purple-500", recovery: "border-l-green-500", cool_down: "border-l-teal-500",
  nutrition: "border-l-lime-500", video: "border-l-pink-500", tennis: "border-l-emerald-500",
  tactical: "border-l-amber-500", technique: "border-l-primary",
};

const CATEGORY_DOT: Record<string, string> = {
  warm_up: "bg-yellow-500", padel_drill: "bg-cyan-500", padel: "bg-cyan-500",
  footwork: "bg-blue-500", fitness: "bg-orange-500", strength: "bg-orange-600",
  mental: "bg-purple-500", recovery: "bg-green-500", cool_down: "bg-teal-500",
  nutrition: "bg-lime-500", video: "bg-pink-500", tennis: "bg-emerald-500",
  tactical: "bg-amber-500", technique: "bg-primary",
};

const MODULE_CATEGORIES = ["All", "Padel", "Tennis", "Fitness", "Mental", "Recovery", "Tactical", "Warm Up"] as const;

/* ── weather helpers ── */
const getWeatherLabel = (code: number) => {
  if (code <= 1) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  return "Thunderstorm";
};

const getWeatherIcon = (code: number) => {
  if (code <= 1) return <Sun size={18} className="text-yellow-400" />;
  if (code <= 3) return <Cloud size={18} className="text-muted-foreground" />;
  if (code <= 67) return <CloudRain size={18} className="text-blue-400" />;
  if (code <= 77) return <CloudSnow size={18} className="text-blue-200" />;
  return <CloudRain size={18} className="text-blue-400" />;
};

const useWeather = (date: Date) => {
  const [weather, setWeather] = useState<{ temp: number; weatherCode: number; windSpeed: number } | null>(null);
  useEffect(() => {
    const diffDays = Math.abs((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) { setWeather(null); return; }
    const dateStr = format(date, "yyyy-MM-dd");
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=39.47&longitude=-0.376&daily=temperature_2m_max,weathercode,windspeed_10m_max&start_date=${dateStr}&end_date=${dateStr}&timezone=Europe/Madrid`)
      .then(r => r.json())
      .then(data => {
        if (data.daily) setWeather({ temp: Math.round(data.daily.temperature_2m_max[0]), weatherCode: data.daily.weathercode[0], windSpeed: Math.round(data.daily.windspeed_10m_max[0]) });
      }).catch(() => {});
  }, [date]);
  return weather;
};

const getGoogleMapsUrl = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

/* ── types ── */
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

interface TrainingBlock {
  id: string; title: string; description: string | null; goal: string;
  category: string; module_ids: string[]; module_durations: number[];
  module_notes: string[]; is_system: boolean; coach_id: string | null;
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

  // Coach info
  const [coachName, setCoachName] = useState<string | null>(null);
  const [coachAvatar, setCoachAvatar] = useState<string | null>(null);

  // Coach editing state
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  // Add panel state
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addTab, setAddTab] = useState<"modules" | "blocks">("modules");
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleCatFilter, setModuleCatFilter] = useState("All");
  const [allModules, setAllModules] = useState<BlockModuleItem[]>([]);
  const [allBlocks, setAllBlocks] = useState<TrainingBlock[]>([]);

  // Month calendar
  const [showMonthCal, setShowMonthCal] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [planDates, setPlanDates] = useState<Set<string>>(new Set());

  // Coach video modal
  const [coachVideoOpen, setCoachVideoOpen] = useState(false);
  const [coachVideoUrl, setCoachVideoUrl] = useState("");
  const [coachVideoTitle, setCoachVideoTitle] = useState("");

  // Player name (for coach view header)
  const [playerName, setPlayerName] = useState("");

  const weather = useWeather(selectedDay);

  const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => { setSelectedDay(parseDateParam(dateParam)); }, [dateParam]);
  useEffect(() => { if (targetPlayerId) fetchDayPlan(); }, [selectedDay, targetPlayerId]);
  useEffect(() => { if (user && isCoachOrAdmin) { fetchModules(); fetchBlocks(); } }, [user]);
  useEffect(() => { if (targetPlayerId) fetchPlanDates(); }, [calMonth, targetPlayerId]);
  useEffect(() => {
    if (isCoachViewingPlayer && playerParam) {
      supabase.from("profiles").select("full_name").eq("user_id", playerParam).single()
        .then(({ data }) => { if (data) setPlayerName(data.full_name); });
    }
  }, [playerParam]);

  const fetchModules = async () => {
    if (!user) return;
    const { data } = await supabase.from("modules")
      .select("id, title, category, duration_minutes")
      .or(`created_by.eq.${user.id},is_shared.eq.true`)
      .order("category");
    setAllModules((data as BlockModuleItem[]) || []);
  };

  const fetchBlocks = async () => {
    if (!user) return;
    const { data } = await supabase.from("training_blocks")
      .select("*")
      .or(`is_system.eq.true,coach_id.eq.${user.id},is_public.eq.true`)
      .order("goal").order("title");
    setAllBlocks((data as TrainingBlock[]) || []);
  };

  const fetchPlanDates = async () => {
    if (!targetPlayerId) return;
    const ms = startOfMonth(calMonth);
    const me = endOfMonth(calMonth);
    const { data } = await supabase.from("player_day_plans")
      .select("plan_date").eq("player_id", targetPlayerId)
      .gte("plan_date", format(ms, "yyyy-MM-dd"))
      .lte("plan_date", format(me, "yyyy-MM-dd"));
    setPlanDates(new Set(data?.map(d => d.plan_date) || []));
  };

  const fetchDayPlan = async () => {
    if (!targetPlayerId) return;
    setLoading(true);
    const dayStr = format(selectedDay, "yyyy-MM-dd");
    const { data: plan } = await supabase.from("player_day_plans")
      .select("id, notes, start_time, end_time, location_name, coach_id")
      .eq("player_id", targetPlayerId).eq("plan_date", dayStr).maybeSingle();

    if (!plan) {
      setPlanItems([]); setPlanNotes(""); setCurrentPlanId(null);
      setEditStartTime(""); setEditEndTime(""); setEditLocation("");
      setCoachName(null); setCoachAvatar(null);
      setLoading(false); return;
    }

    setCurrentPlanId(plan.id);
    setPlanNotes(plan.notes || "");
    setEditStartTime(plan.start_time || "");
    setEditEndTime(plan.end_time || "");
    setEditLocation((plan as any).location_name || "");

    // Fetch coach info
    if (plan.coach_id) {
      const { data: coachProfile } = await supabase.from("profiles")
        .select("full_name, avatar_url").eq("user_id", plan.coach_id).maybeSingle();
      setCoachName(coachProfile?.full_name || null);
      setCoachAvatar(coachProfile?.avatar_url || null);
    }

    const { data: items } = await supabase.from("player_day_plan_items")
      .select("id, order_index, is_completed, completed_at, coach_note, module_id")
      .eq("plan_id", plan.id).order("order_index");

    const moduleIds = items?.map(i => i.module_id) || [];
    const { data: mods } = await supabase.from("modules")
      .select("id, title, category, duration_minutes, description, instructions, video_url, coach_video_url")
      .in("id", moduleIds.length > 0 ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

    const moduleMap = new Map(mods?.map((m: any) => [m.id, m]) || []);
    setPlanItems(
      (items || []).map(item => ({
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
      .update({ is_completed: true, completed_at: new Date().toISOString() }).eq("id", itemId);
    setPlanItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, is_completed: true, completed_at: new Date().toISOString() } : item
    ));
  };

  /* ── Ensure plan exists ── */
  const ensurePlan = async (): Promise<string | null> => {
    if (currentPlanId) return currentPlanId;
    if (!targetPlayerId || !user) return null;
    const dayStr = format(selectedDay, "yyyy-MM-dd");
    const { data: newPlan } = await supabase.from("player_day_plans")
      .insert({ player_id: targetPlayerId, coach_id: user.id, plan_date: dayStr, notes: "" })
      .select("id").single();
    if (!newPlan) { toast.error("Failed to create plan"); return null; }
    setCurrentPlanId(newPlan.id);
    return newPlan.id;
  };

  /* ── Add single module ── */
  const handleAddModule = async (mod: BlockModuleItem) => {
    const planId = await ensurePlan();
    if (!planId) return;
    const orderIndex = planItems.length;
    const { data } = await supabase.from("player_day_plan_items")
      .insert({ plan_id: planId, module_id: mod.id, order_index: orderIndex })
      .select("id").single();
    if (data) {
      setPlanItems(prev => [...prev, {
        id: data.id, order_index: orderIndex, is_completed: false,
        completed_at: null, coach_note: null,
        module: { ...mod, description: null, instructions: null, video_url: null, coach_video_url: null, duration_minutes: mod.duration_minutes || 15 },
      }]);
      toast.success(`Added "${mod.title}"`);
    }
  };

  /* ── Apply block ── */
  const handleApplyBlock = async (block: TrainingBlock) => {
    const planId = await ensurePlan();
    if (!planId) return;
    const moduleMap = new Map(allModules.map(m => [m.id, m]));
    const existingMax = planItems.length;
    const newItems = block.module_ids.map((moduleId, idx) => {
      const mod = moduleMap.get(moduleId);
      if (!mod) return null;
      return { plan_id: planId, module_id: moduleId, order_index: existingMax + idx, coach_note: block.module_notes[idx] || null };
    }).filter(Boolean);

    if (newItems.length === 0) { toast.error("Block references modules you don't have"); return; }
    await supabase.from("player_day_plan_items").insert(newItems as any);
    toast.success(`Applied "${block.title}" — ${newItems.length} modules`);
    fetchDayPlan();
  };

  /* ── Save plan ── */
  const handleSavePlan = async () => {
    if (!currentPlanId) return;
    if (!editStartTime || !editEndTime) {
      toast.error("Please set both start and end times.");
      return;
    }
    setSavingPlan(true);
    await supabase.from("player_day_plans").update({
      start_time: editStartTime || null, end_time: editEndTime || null,
      location_name: editLocation || null, notes: planNotes || null,
    }).eq("id", currentPlanId);
    toast.success("Training day saved!");
    setSavingPlan(false);
  };

  /* ── Save as block ── */
  const handleSaveAsBlock = async () => {
    if (!user || planItems.length === 0) return;
    const blockTitle = prompt("Name for this training block:");
    if (!blockTitle) return;
    const totalDur = planItems.reduce((sum, i) => sum + i.module.duration_minutes, 0);

    const profileRes = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single();
    const { error } = await supabase.from("training_blocks").insert({
      title: blockTitle,
      description: `Custom block with ${planItems.length} modules`,
      category: "padel_drill",
      sport: "both",
      difficulty: "intermediate",
      duration_minutes: totalDur,
      coach_id: user.id,
      author_id: user.id,
      author_name: profileRes.data?.full_name || "",
      author_avatar_url: profileRes.data?.avatar_url || null,
      goal: "Custom",
      is_system: false,
      is_custom: true,
      is_public: false,
      module_ids: planItems.map(i => i.module.id),
      module_durations: planItems.map(i => i.module.duration_minutes),
      module_notes: planItems.map(i => i.coach_note || ""),
    });

    if (error) { toast.error("Failed to save block"); return; }
    toast.success(`Saved "${blockTitle}" as a training block`);
    fetchBlocks();
  };

  /* ── Cancel day ── */
  const handleCancelDay = async () => {
    if (!currentPlanId || !confirm("Cancel this training day? All modules will be removed.")) return;
    await supabase.from("player_day_plan_items").delete().eq("plan_id", currentPlanId);
    await supabase.from("player_day_plans").delete().eq("id", currentPlanId);
    toast.success("Training day cancelled");
    setCurrentPlanId(null); setPlanItems([]); setPlanNotes("");
    setEditStartTime(""); setEditEndTime(""); setEditLocation("");
    setCoachName(null); setCoachAvatar(null);
  };

  /* ── Reorder ── */
  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= planItems.length) return;
    const updated = [...planItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    const reordered = updated.map((item, i) => ({ ...item, order_index: i }));
    setPlanItems(reordered);
    for (const item of reordered) {
      await supabase.from("player_day_plan_items").update({ order_index: item.order_index }).eq("id", item.id);
    }
  };

  /* ── Remove item ── */
  const handleRemoveItem = async (itemId: string) => {
    await supabase.from("player_day_plan_items").delete().eq("id", itemId);
    const remaining = planItems.filter(i => i.id !== itemId);
    const reordered = remaining.map((item, i) => ({ ...item, order_index: i }));
    setPlanItems(reordered);
    for (const item of reordered) {
      await supabase.from("player_day_plan_items").update({ order_index: item.order_index }).eq("id", item.id);
    }
    toast.success("Module removed");
    if (reordered.length === 0 && currentPlanId) {
      await supabase.from("player_day_plans").delete().eq("id", currentPlanId);
      setCurrentPlanId(null); setPlanNotes("");
    }
  };

  /* ── Navigate to plan builder ── */
  const handleEditInBuilder = () => {
    if (!targetPlayerId) return;
    navigate(`/coach/plan/${targetPlayerId}?date=${format(selectedDay, "yyyy-MM-dd")}`);
  };

  const totalDuration = planItems.reduce((sum, i) => sum + (i.module.duration_minutes || 0), 0);

  // Filtered modules for add panel
  const filteredModules = useMemo(() => {
    return allModules.filter(m => {
      const matchCat = moduleCatFilter === "All" || m.category.toLowerCase().includes(moduleCatFilter.toLowerCase());
      const matchSearch = !moduleSearch || m.title.toLowerCase().includes(moduleSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allModules, moduleCatFilter, moduleSearch]);

  // Month calendar days
  const monthStart = startOfMonth(calMonth);
  const mEnd = endOfMonth(calMonth);
  const calStartPad = (getDay(monthStart) + 6) % 7;
  const calDays = eachDayOfInterval({ start: monthStart, end: mEnd });

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto pb-24">
        {/* Back button for coach */}
        {isCoachViewingPlayer && (
          <button onClick={() => navigate(`/coach/players/${playerParam}`)}
            className="inline-flex items-center gap-2 mb-3 text-muted-foreground hover:text-foreground transition-colors font-body text-sm">
            <ChevronLeft size={16} /> Back to {playerName || "Player"}
          </button>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl text-foreground">
              {isCoachViewingPlayer ? `${playerName || "Player"}'s Plan` : "TRAINING"}
            </h1>
            <p className="text-xs font-body text-muted-foreground mt-0.5">
              {format(selectedDay, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <button onClick={() => { setShowMonthCal(!showMonthCal); setCalMonth(selectedDay); }}
            className={`p-2 rounded-lg border transition-colors ${showMonthCal ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
            <CalendarDays size={16} />
          </button>
        </div>

        {/* Month calendar */}
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
                  {Array(calStartPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
                  {calDays.map(day => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const selected = isSameDay(day, selectedDay);
                    const isToday = isSameDay(day, new Date());
                    const hasPlan = planDates.has(dateStr);
                    return (
                      <button key={dateStr} onClick={() => { setSelectedDay(day); setShowMonthCal(false); }}
                        className={`relative py-1.5 rounded-md text-xs font-body transition-colors ${
                          selected ? "bg-primary text-primary-foreground"
                            : isToday ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}>
                        {format(day, "d")}
                        {hasPlan && !selected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Week strip */}
        <div className="flex gap-1.5 mb-4">
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDay);
            const hasPlan = planDates.has(format(day, "yyyy-MM-dd"));
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                className={`flex-1 py-2 rounded-lg text-center transition-colors relative ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"
                }`}>
                <span className="font-display text-[10px] block">{format(day, "EEE")}</span>
                <span className="font-body text-xs">{format(day, "d")}</span>
                {hasPlan && !isSelected && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Player-only: training day info */}
        {targetPlayerId && !isCoachOrAdmin && (
          <div className="mb-6">
            <TrainingDayInfo playerId={targetPlayerId} date={format(selectedDay, "yyyy-MM-dd")} />
          </div>
        )}

        {/* Coach: session info card */}
        {isCoachOrAdmin && planItems.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1 block">LOCATION</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="e.g. Court 3"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1 block">START TIME</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-primary" />
                  </div>
                  <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1 block">END TIME</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock size={14} className="text-primary" />
                  </div>
                  <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
            </div>

            {/* Coach info + weather row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3 pt-3 border-t border-border">
              {coachName && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {coachAvatar ? (
                      <img src={coachAvatar} alt={coachName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-display tracking-wider text-muted-foreground">COACH</p>
                    <p className="font-body text-sm text-foreground truncate">{coachName}</p>
                  </div>
                </div>
              )}
              {weather && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {getWeatherIcon(weather.weatherCode)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-display tracking-wider text-muted-foreground">WEATHER</p>
                    <p className="font-body text-sm text-foreground">
                      {weather.temp}°C · {getWeatherLabel(weather.weatherCode)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Coach action buttons */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handleSavePlan} disabled={savingPlan}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <Save size={14} /> {savingPlan ? "SAVING..." : "SAVE TRAINING DAY"}
                </button>
                <button onClick={handleEditInBuilder}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground font-display text-xs tracking-wider hover:bg-secondary/80 transition-colors">
                  <Plus size={12} /> EDIT IN BUILDER
                </button>
                <button onClick={handleSaveAsBlock}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground font-display text-xs tracking-wider hover:bg-secondary/80 transition-colors">
                  <Save size={12} /> SAVE AS BLOCK
                </button>
              </div>
              <button onClick={handleCancelDay}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 font-display text-xs tracking-wider transition-colors">
                <Trash2 size={14} /> CANCEL DAY
              </button>
            </div>
          </div>
        )}

        {/* Weather standalone when no plan */}
        {weather && !loading && planItems.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-center gap-2">
            {getWeatherIcon(weather.weatherCode)}
            <span className="font-body text-sm text-muted-foreground">
              {weather.temp}°C · {getWeatherLabel(weather.weatherCode)} · Wind {weather.windSpeed} km/h
            </span>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Workout summary header */}
            {planItems.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-[10px] tracking-wider text-muted-foreground">
                  WORKOUT · {planItems.length} MODULE{planItems.length !== 1 ? "S" : ""} · {totalDuration} MIN
                </p>
                {isCoachOrAdmin && (
                  <button onClick={() => { setShowAddPanel(true); setAddTab("modules"); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-[9px] tracking-wider hover:bg-primary/90 transition-colors">
                    <Plus size={11} /> ADD
                  </button>
                )}
              </div>
            )}

            {/* Plan items — builder cards */}
            {planItems.length > 0 ? (
              <div className="space-y-2">
                {planItems.map((item, index) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`bg-card border border-border rounded-xl overflow-hidden border-l-4 ${CATEGORY_COLORS[item.module.category] || "border-l-muted"}`}>
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        {/* Reorder controls (coach) */}
                        {isCoachOrAdmin && (
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button onClick={() => handleMoveItem(index, "up")} disabled={index === 0}
                              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                              <ChevronUp size={12} />
                            </button>
                            <button onClick={() => handleMoveItem(index, "down")} disabled={index === planItems.length - 1}
                              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                              <ChevronDown size={12} />
                            </button>
                          </div>
                        )}

                        {/* Module info */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[item.module.category] || "bg-muted-foreground"}`} />
                            <span className="font-display text-sm text-foreground truncate">{item.module.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 ml-4">
                            <span className="font-body text-[10px] text-muted-foreground uppercase">
                              {item.module.category.replace("_", " ")}
                            </span>
                            <span className="text-muted-foreground text-[10px]">·</span>
                            <span className="flex items-center gap-0.5 text-muted-foreground text-[10px] font-body">
                              <Clock size={9} /> {item.module.duration_minutes} min
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isCoachOrAdmin ? (
                            <button onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Minus size={14} />
                            </button>
                          ) : (
                            !item.is_completed ? (
                              <button onClick={() => markComplete(item.id)}
                                className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-display text-[9px] tracking-wider hover:bg-primary/90 transition-colors">
                                DONE
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 text-green-500 font-body text-[10px]">
                                <Check size={12} /> Done
                              </span>
                            )
                          )}
                          <button onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                            {expandedItem === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {expandedItem === item.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-border overflow-hidden">
                            {item.module.description && (
                              <p className="text-xs font-body text-muted-foreground mb-2">{item.module.description}</p>
                            )}
                            {item.module.instructions && (
                              <div className="text-xs font-body text-foreground mb-2 whitespace-pre-wrap">{item.module.instructions}</div>
                            )}
                            {item.module.video_url && (
                              <div className="aspect-video rounded-lg overflow-hidden mb-2">
                                <iframe src={item.module.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                                  className="w-full h-full" allowFullScreen loading="lazy" title={item.module.title} />
                              </div>
                            )}
                            {item.coach_note && (
                              <div className="bg-secondary rounded-lg p-2.5 mt-1">
                                <p className="text-[9px] font-display tracking-wider text-muted-foreground mb-0.5">COACH NOTE</p>
                                <p className="text-xs font-body text-foreground">{item.coach_note}</p>
                              </div>
                            )}
                            {(item.module as any).coach_video_url && (
                              <button onClick={() => { setCoachVideoUrl((item.module as any).coach_video_url); setCoachVideoTitle(item.module.title); setCoachVideoOpen(true); }}
                                className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-display text-[9px] tracking-wider hover:bg-primary/20 transition-colors">
                                <Video size={12} /> WATCH COACH DEMO
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}

                {/* Add more modules inline button */}
                {isCoachOrAdmin && (
                  <button onClick={() => { setShowAddPanel(true); setAddTab("modules"); }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground font-display text-[10px] tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                    <Plus size={12} /> ADD BLOCKS OR MODULES
                  </button>
                )}

                {/* Player total */}
                {!isCoachOrAdmin && (
                  <div className="text-center pt-2">
                    <p className="text-xs font-body text-muted-foreground">
                      {planItems.filter(i => i.is_completed).length}/{planItems.length} completed · {totalDuration} min total
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state */
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
                  <Layers size={24} className="text-muted-foreground" />
                </div>
                <p className="font-display text-lg text-muted-foreground mb-1">NO PLAN YET</p>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  {isCoachOrAdmin ? "Start building a workout for this day." : "Your coach hasn't assigned a plan yet."}
                </p>
                {isCoachOrAdmin && (
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => { setShowAddPanel(true); setAddTab("blocks"); }}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5">
                      <Layers size={14} /> USE A BLOCK
                    </button>
                    <button onClick={() => { setShowAddPanel(true); setAddTab("modules"); }}
                      className="px-4 py-2.5 rounded-xl bg-card border border-border text-foreground font-display text-xs tracking-wider hover:bg-secondary transition-colors inline-flex items-center gap-1.5">
                      <Plus size={14} /> ADD MODULES
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Sticky Footer (coach, has items) ─── */}
      {isCoachOrAdmin && planItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-30 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <p className="font-display text-xs tracking-wider text-foreground">
              {planItems.length} module{planItems.length !== 1 ? "s" : ""} · {totalDuration} min
            </p>
            <div className="flex items-center gap-2">
              <button onClick={handleCancelDay}
                className="p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 size={14} />
              </button>
              <button onClick={handleSavePlan} disabled={savingPlan}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                <Save size={14} /> {savingPlan ? "SAVING..." : "SAVE PLAN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Panel (slide-up) ─── */}
      <AnimatePresence>
        {showAddPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 z-40" onClick={() => setShowAddPanel(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 max-h-[75vh] flex flex-col">

              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-3 px-4 pb-2 border-b border-border">
                <button onClick={() => setAddTab("modules")}
                  className={`font-display text-xs tracking-wider pb-2 border-b-2 transition-colors ${addTab === "modules" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  MODULES
                </button>
                <button onClick={() => setAddTab("blocks")}
                  className={`font-display text-xs tracking-wider pb-2 border-b-2 transition-colors ${addTab === "blocks" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  BLOCKS
                </button>
                <div className="flex-1" />
                <button onClick={() => setShowAddPanel(false)} className="p-1 rounded-lg hover:bg-secondary">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {addTab === "modules" ? (
                  <>
                    {/* Search */}
                    <div className="relative mb-3">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={moduleSearch} onChange={e => setModuleSearch(e.target.value)}
                        placeholder="Search modules..."
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
                    </div>

                    {/* Category filters */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {MODULE_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setModuleCatFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg font-display text-[9px] tracking-wider transition-colors ${
                            moduleCatFilter === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}>{cat.toUpperCase()}</button>
                      ))}
                    </div>

                    {/* Module list */}
                    <div className="space-y-1.5">
                      {filteredModules.map(mod => (
                        <button key={mod.id} onClick={() => handleAddModule(mod)}
                          className={`w-full text-left p-2.5 rounded-xl border border-border hover:border-primary/40 transition-colors flex items-center gap-3 border-l-4 ${CATEGORY_COLORS[mod.category] || "border-l-muted"}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-xs text-foreground truncate">{mod.title}</p>
                            <p className="text-[10px] font-body text-muted-foreground">{mod.category.replace("_", " ")} · {mod.duration_minutes || 15} min</p>
                          </div>
                          <Plus size={14} className="text-primary shrink-0" />
                        </button>
                      ))}
                      {filteredModules.length === 0 && (
                        <p className="text-xs font-body text-muted-foreground text-center py-6">No modules found</p>
                      )}
                    </div>
                  </>
                ) : (
                  /* Blocks tab */
                  <div className="space-y-1.5">
                    {allBlocks.map(block => {
                      const totalDur = block.module_durations?.reduce((s, d) => s + d, 0) || 0;
                      return (
                        <button key={block.id} onClick={() => { handleApplyBlock(block); setShowAddPanel(false); }}
                          className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-display text-xs text-foreground truncate flex-1">{block.title}</p>
                            <Plus size={14} className="text-primary shrink-0 ml-2" />
                          </div>
                          {block.description && (
                            <p className="text-[10px] font-body text-muted-foreground line-clamp-1 mb-0.5">{block.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-[9px] font-body text-muted-foreground">
                            <span>{block.module_ids.length} modules</span>
                            <span>·</span>
                            <span>{totalDur} min</span>
                            {block.is_system && <span className="text-primary/60">SYSTEM</span>}
                          </div>
                        </button>
                      );
                    })}
                    {allBlocks.length === 0 && (
                      <p className="text-xs font-body text-muted-foreground text-center py-6">No blocks available</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CoachVideoModal open={coachVideoOpen} onClose={() => setCoachVideoOpen(false)} videoUrl={coachVideoUrl} moduleTitle={coachVideoTitle} />
    </PortalLayout>
  );
};

export default Training;
