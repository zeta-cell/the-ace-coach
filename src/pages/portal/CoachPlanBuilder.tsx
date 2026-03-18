import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, Plus, X, GripVertical, Clock, Save, Check, Search, CalendarDays, MapPin, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, getWeek, subMonths, addMonths } from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import TrainingBlocksPanel from "@/components/portal/TrainingBlocksPanel";
import type { Database } from "@/integrations/supabase/types";

type ModuleCategory = Database["public"]["Enums"]["module_category"];

const CATEGORY_COLORS: Record<string, string> = {
  warm_up: "bg-yellow-500",
  padel_drill: "bg-cyan-500",
  footwork: "bg-blue-500",
  fitness: "bg-orange-500",
  strength: "bg-orange-600",
  mental: "bg-purple-500",
  recovery: "bg-green-500",
  cool_down: "bg-teal-500",
  nutrition: "bg-lime-500",
  video: "bg-pink-500",
};

interface ModuleItem {
  id: string;
  title: string;
  category: ModuleCategory;
  duration_minutes: number | null;
}

interface PlanItem {
  tempId: string;
  module: ModuleItem;
  coach_note: string;
  custom_duration: number;
}

/* ── Sortable item component ── */
const SortablePlanItem = ({
  item,
  onRemove,
  onNoteChange,
  onDurationChange,
  onDurationSave,
}: {
  item: PlanItem;
  onRemove: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
  onDurationChange: (id: string, duration: number) => void;
  onDurationSave: (id: string, moduleId: string, duration: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.tempId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDurationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleDurationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (!val || val < 5) val = 5;
    if (val > 300) val = 300;
    onDurationChange(item.tempId, val);
    onDurationSave(item.tempId, item.module.id, val);
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex">
        <div className={`w-1 ${CATEGORY_COLORS[item.module.category] || "bg-muted"}`} />
        <div className="flex-1 p-3">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
              <GripVertical size={14} className="text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-body text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                  {item.module.category.replace("_", " ")}
                </span>
                <div className="flex items-center gap-0.5 text-muted-foreground text-xs font-body">
                  <Clock size={10} />
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={item.custom_duration === 0 ? "" : item.custom_duration}
                    onChange={(e) => {
                      const raw = e.target.value;
                      onDurationChange(item.tempId, raw === "" ? 0 : parseInt(raw) || 0);
                    }}
                    onBlur={handleDurationBlur}
                    onKeyDown={handleDurationKeyDown}
                    className="w-[52px] bg-transparent text-center text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary rounded"
                  />
                  <span>min</span>
                </div>
              </div>
              <p className="font-display text-foreground mt-0.5">{item.module.title}</p>
            </div>
            <button onClick={() => onRemove(item.tempId)} className="p-1 hover:bg-destructive/20 rounded-lg transition-colors shrink-0">
              <X size={14} className="text-destructive" />
            </button>
          </div>
          <input
            placeholder="Coach note for this module..."
            value={item.coach_note}
            onChange={(e) => onNoteChange(item.tempId, e.target.value)}
            className="w-full mt-2 px-2 py-1.5 rounded-lg bg-secondary text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
};

/* ── Inline Add Module Row ── */
const InlineAddModule = ({
  onAdd,
  userId,
}: {
  onAdd: (mod: ModuleItem) => void;
  userId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ModuleItem[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = search.trim();
    if (term.length < 1) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("modules")
        .select("id, title, duration_minutes, category")
        .or(`created_by.eq.${userId},is_shared.eq.true`)
        .ilike("title", `%${term}%`)
        .limit(8);
      setResults((data as ModuleItem[]) || []);
    }, 200);
    return () => clearTimeout(t);
  }, [search, open, userId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setSearch(""); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground font-display text-xs tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <Search size={14} /> SEARCH ALL MODULES
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Search size={12} className="text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search modules..."
          className="flex-1 bg-transparent text-foreground font-body text-xs focus:outline-none placeholder:text-muted-foreground"
        />
        <button onClick={() => { setOpen(false); setSearch(""); }} className="p-0.5">
          <X size={12} className="text-muted-foreground" />
        </button>
      </div>
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
          {results.map((mod) => (
            <button
              key={mod.id}
              onClick={() => { onAdd(mod); setSearch(""); }}
              className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[mod.category] || "bg-muted"}`} />
              <span className="font-body text-xs text-foreground flex-1 truncate">{mod.title}</span>
              <span className="text-[10px] text-muted-foreground font-body">{mod.duration_minutes || 0}m</span>
              <Plus size={12} className="text-primary shrink-0" />
            </button>
          ))}
        </div>
      )}
      {search.length > 0 && results.length === 0 && (
        <p className="text-center text-[10px] font-body text-muted-foreground py-3">Keine Module gefunden</p>
      )}
    </div>
  );
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "ALL", warm_up: "WARM UP", padel_drill: "PADEL", footwork: "FOOTWORK",
  fitness: "FITNESS", strength: "STRENGTH", mental: "MENTAL", recovery: "RECOVERY",
  cool_down: "COOL DOWN", nutrition: "NUTRITION", video: "VIDEO",
};

/* ── Main component ── */
const CoachPlanBuilder = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const initialDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const [planDate, setPlanDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [moduleSearch, setModuleSearch] = useState("");
  const [showModulePicker, setShowModulePicker] = useState(false);
  const [moduleCategory, setModuleCategory] = useState("all");
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [showMonthCal, setShowMonthCal] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);
  const [weekPlanDates, setWeekPlanDates] = useState<Set<string>>(new Set());
  const [showSaveBlock, setShowSaveBlock] = useState(false);
  const [blockTitle, setBlockTitle] = useState("");
  const [blockGoal, setBlockGoal] = useState("Technique");
  const [blockDesc, setBlockDesc] = useState("");

  // Week context from CoachPlayerDetail
  const weekParam = searchParams.get("week");
  const blockIdParam = searchParams.get("block_id");
  const [weekBlockData, setWeekBlockData] = useState<{ title: string; week_count: number; weekly_structure: any } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (user && playerId) {
      fetchPlayerName();
      fetchModules();
    }
  }, [user, playerId]);

  useEffect(() => {
    if (user && playerId && planDate) {
      loadExistingPlan();
      fetchWeekPlanDates();
    }
  }, [user, playerId, planDate]);

  useEffect(() => {
    if (blockIdParam) {
      supabase.from("training_blocks").select("title, week_count, weekly_structure")
        .eq("id", blockIdParam).single().then(({ data }) => {
          if (data) setWeekBlockData(data);
        });
    }
  }, [blockIdParam]);

  const fetchPlayerName = async () => {
    if (!playerId) return;
    const { data } = await supabase.from("profiles").select("full_name").eq("user_id", playerId).single();
    setPlayerName(data?.full_name || "Player");
  };

  const fetchModules = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("modules")
      .select("id, title, category, duration_minutes")
      .or(`created_by.eq.${user.id},is_shared.eq.true`)
      .order("category");
    setModules((data as ModuleItem[]) || []);
  };

  const fetchWeekPlanDates = async () => {
    if (!user || !playerId) return;
    const ms = startOfMonth(new Date(planDate));
    const rangeStart = format(startOfWeek(ms, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const rangeEnd = format(addDays(endOfMonth(ms), 7), "yyyy-MM-dd");
    const { data } = await supabase
      .from("player_day_plans")
      .select("plan_date")
      .eq("player_id", playerId)
      .eq("coach_id", user.id)
      .gte("plan_date", rangeStart)
      .lte("plan_date", rangeEnd);
    setWeekPlanDates(new Set(data?.map((d) => d.plan_date) || []));
  };

  const loadExistingPlan = async () => {
    if (!user || !playerId) return;
    const { data: plan } = await supabase
      .from("player_day_plans")
      .select("id, notes, start_time, end_time, location_name, location_address, location_lat, location_lng")
      .eq("player_id", playerId)
      .eq("coach_id", user.id)
      .eq("plan_date", planDate)
      .maybeSingle();

    if (plan) {
      setExistingPlanId(plan.id);
      setPlanNotes(plan.notes || "");
      setStartTime(plan.start_time || "");
      setEndTime(plan.end_time || "");
      setLocationName(plan.location_name || "");
      setLocationAddress(plan.location_address || "");
      setLocationLat(plan.location_lat?.toString() || "");
      setLocationLng(plan.location_lng?.toString() || "");
      const { data: items } = await supabase
        .from("player_day_plan_items")
        .select("id, module_id, coach_note, order_index")
        .eq("plan_id", plan.id)
        .order("order_index");

      const moduleIds = items?.map((i) => i.module_id) || [];
      if (moduleIds.length > 0) {
        const { data: mods } = await supabase
          .from("modules")
          .select("id, title, category, duration_minutes")
          .in("id", moduleIds);
        const modMap = new Map(mods?.map((m) => [m.id, m]) || []);
        setPlanItems(
          (items || []).map((item) => {
            const mod = (modMap.get(item.module_id) as ModuleItem) || { id: item.module_id, title: "Unknown", category: "padel_drill" as ModuleCategory, duration_minutes: 0 };
            return {
              tempId: item.id,
              module: mod,
              coach_note: item.coach_note || "",
              custom_duration: mod.duration_minutes || 0,
            };
          })
        );
      } else {
        setPlanItems([]);
      }
    } else {
      setExistingPlanId(null);
      setPlanItems([]);
      setPlanNotes("");
      setStartTime("");
      setEndTime("");
      setLocationName("");
      setLocationAddress("");
      setLocationLat("");
      setLocationLng("");
    }
  };

  const addModule = (mod: ModuleItem) => {
    setPlanItems((prev) => [...prev, { tempId: crypto.randomUUID(), module: mod, coach_note: "", custom_duration: mod.duration_minutes || 0 }]);
    // Flash feedback on the module row
    setJustAddedId(mod.id);
    setTimeout(() => setJustAddedId(null), 800);
    toast.success(`Added "${mod.title}"`, { duration: 1500 });
    // Keep browse open for quick multi-add, but close modal if open
    if (showModulePicker) {
      setShowModulePicker(false);
      setModuleSearch("");
      setModuleCategory("all");
    }
  };

  const removeItem = async (tempId: string) => {
    const prev = planItems;
    setPlanItems((p) => p.filter((i) => i.tempId !== tempId));

    // If this item exists in DB (existingPlanId means plan is saved, tempId is the DB id)
    if (existingPlanId) {
      const { error } = await supabase.from("player_day_plan_items").delete().eq("id", tempId);
      if (error) {
        setPlanItems(prev);
        toast.error("Fehler beim Löschen");
        return;
      }
      toast.success("Modul entfernt", { duration: 1500 });

      // If no items left, delete the plan itself
      const remaining = prev.filter((i) => i.tempId !== tempId);
      if (remaining.length === 0) {
        await supabase.from("player_day_plans").delete().eq("id", existingPlanId);
        setExistingPlanId(null);
      }
    }
  };

  const updateNote = (tempId: string, note: string) => {
    setPlanItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, coach_note: note } : i)));
  };

  const updateDuration = (tempId: string, duration: number) => {
    setPlanItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, custom_duration: duration } : i)));
  };

  const saveDurationToDB = async (_tempId: string, moduleId: string, duration: number) => {
    const { error } = await supabase
      .from("modules")
      .update({ duration_minutes: duration })
      .eq("id", moduleId);
    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      toast.success("Saved", { duration: 1500 });
    }
  };

  const handleInlineAdd = (mod: ModuleItem) => {
    addModule(mod);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlanItems((items) => {
        const oldIndex = items.findIndex((i) => i.tempId === active.id);
        const newIndex = items.findIndex((i) => i.tempId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!user || !playerId || planItems.length === 0) return;
    if (!startTime || !endTime) {
      toast.error("Please set both start and end times before saving.");
      return;
    }
    setSaving(true);
    let planId = existingPlanId;

    if (planId) {
      await supabase.from("player_day_plan_items").delete().eq("plan_id", planId);
      await supabase.from("player_day_plans").update({ 
        notes: planNotes || null,
        start_time: startTime || null,
        end_time: endTime || null,
        location_name: locationName || null,
        location_address: locationAddress || null,
        location_lat: locationLat ? parseFloat(locationLat) : null,
        location_lng: locationLng ? parseFloat(locationLng) : null,
      }).eq("id", planId);
    } else {
      const { data } = await supabase
        .from("player_day_plans")
        .insert({ 
          player_id: playerId, 
          coach_id: user.id, 
          plan_date: planDate, 
          notes: planNotes || null,
          start_time: startTime || null,
          end_time: endTime || null,
          location_name: locationName || null,
          location_address: locationAddress || null,
          location_lat: locationLat ? parseFloat(locationLat) : null,
          location_lng: locationLng ? parseFloat(locationLng) : null,
        })
        .select("id")
        .single();
      planId = data?.id || null;
    }

    if (planId) {
      const items = planItems.map((item, idx) => ({
        plan_id: planId!,
        module_id: item.module.id,
        order_index: idx,
        coach_note: item.coach_note || null,
        block_id: 'block_id' in item ? (item as any).block_id : null,
      }));
      await supabase.from("player_day_plan_items").insert(items);
      setExistingPlanId(planId);
    }

    // FIX 8: notify player of new/updated plan
    await supabase.from("notifications").insert({
      user_id: playerId,
      title: "New training plan",
      body: `Your coach added a plan for ${format(new Date(planDate), "EEE d MMM")}`,
      link: "/training",
    });

    toast.success("Plan saved!");
    setSaving(false);
    setSaved(true);
    fetchWeekPlanDates();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAsBlock = async () => {
    if (!user || planItems.length === 0 || !blockTitle.trim()) {
      toast.error("Add a title and at least one module");
      return;
    }
    await supabase.from("training_blocks").insert({
      coach_id: user.id,
      title: blockTitle.trim(),
      description: blockDesc.trim() || null,
      goal: blockGoal,
      category: "custom",
      module_ids: planItems.map((i) => i.module.id),
      module_durations: planItems.map((i) => i.custom_duration),
      module_notes: planItems.map((i) => i.coach_note),
      is_system: false,
    });
    toast.success("Training block saved!");
    setShowSaveBlock(false);
    setBlockTitle("");
    setBlockDesc("");
  };

  const handleApplyBlock = (items: PlanItem[]) => {
    setPlanItems((prev) => [...prev, ...items]);
  };

  const totalDuration = planItems.reduce((sum, i) => sum + (i.custom_duration || 0), 0);
  const filteredModules = modules.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(moduleSearch.toLowerCase());
    const matchCat = moduleCategory === "all" || m.category === moduleCategory;
    return matchSearch && matchCat;
  });

  const browsedModules = browseCategory
    ? modules.filter((m) => m.category === browseCategory)
    : [];

  const renderModuleBrowser = () => (
    <div className="mb-4">
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-2">ADD MODULES BY CATEGORY</p>
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== "all").map(([key, label]) => (
          <button
            key={key}
            onClick={() => setBrowseCategory(browseCategory === key ? null : key)}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-display text-xs tracking-wider transition-colors ${
              browseCategory === key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {browseCategory && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 bg-card border border-border rounded-xl overflow-hidden"
        >
          <div className="max-h-48 overflow-y-auto p-2 space-y-0.5">
            {browsedModules.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4 font-body">No modules in this category.</p>
            ) : (
              browsedModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => addModule(mod)}
                  className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                    justAddedId === mod.id ? "bg-green-500/20 ring-1 ring-green-500/40" : "hover:bg-secondary"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[mod.category] || "bg-muted"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm text-foreground truncate">{mod.title}</p>
                    <p className="text-[10px] font-body text-muted-foreground">{mod.duration_minutes || 0} min</p>
                  </div>
                  {justAddedId === mod.id ? <Check size={14} className="text-green-400 flex-shrink-0" /> : <Plus size={14} className="text-muted-foreground flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}

      <button
        onClick={() => setShowModulePicker(true)}
        className="w-full py-3 mt-2 rounded-xl border-2 border-dashed border-border text-muted-foreground font-display text-sm tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <Search size={16} /> SEARCH ALL MODULES
      </button>
    </div>
  );

  // 3-week view: current week + next 2
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const dateOptions = Array.from({ length: 21 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { value: format(d, "yyyy-MM-dd"), date: d, label: format(d, "EEE d") };
  });

  const today = new Date();

  return (
    <PortalLayout>
      <div className="flex gap-6">
        {/* Left: Training Blocks Panel (desktop only) */}
        <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[80px] self-start max-h-[calc(100vh-96px)] overflow-y-auto pr-2 scrollbar-none">
          <TrainingBlocksPanel
            onApplyBlock={handleApplyBlock}
            onSaveAsBlock={() => setShowSaveBlock(true)}
            modules={modules}
          />
        </aside>

        {/* Right: Plan builder */}
        <div className="flex-1 max-w-3xl min-w-0">
        <Link to={`/coach/players/${playerId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to {playerName}
        </Link>

        {weekBlockData && weekParam && (
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-xs tracking-wider text-primary">
                  EDITING WEEK {weekParam} OF {weekBlockData.title.toUpperCase()}
                </p>
                <p className="text-[10px] font-body text-muted-foreground">{weekBlockData.week_count}-week program</p>
              </div>
              <Link to={`/coach/players/${playerId}`} className="text-[10px] font-display text-primary hover:underline">
                ← BACK TO PLAYER
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="font-display text-3xl text-foreground">DAY PLAN</h1>
            <p className="font-body text-sm text-muted-foreground mb-4">for {playerName}</p>
          </div>
          <button
            onClick={() => setShowMonthCal(!showMonthCal)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-display text-xs tracking-wider transition-colors ${
              showMonthCal ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <CalendarDays size={14} />
            {format(new Date(planDate), "MMM yyyy").toUpperCase()}
          </button>
        </div>

        {/* Month calendar view */}
        {showMonthCal && (() => {
          const monthStart = startOfMonth(calMonth);
          const monthEnd = endOfMonth(calMonth);
          const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
          const days: Date[] = [];
          let d = calStart;
          while (d <= monthEnd || days.length % 7 !== 0) {
            days.push(d);
            d = addDays(d, 1);
          }
          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-card border border-border rounded-xl p-3 mb-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
                  <ArrowLeft size={14} />
                </button>
                <p className="font-display text-sm tracking-wider text-foreground">
                  {format(calMonth, "MMMM yyyy").toUpperCase()}
                </p>
                <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground rotate-180">
                  <ArrowLeft size={14} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {["M","T","W","T","F","S","S"].map((day, i) => (
                  <div key={i} className="text-center font-display text-[10px] text-muted-foreground py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day) => {
                  const val = format(day, "yyyy-MM-dd");
                  const isSelected = planDate === val;
                  const isToday2 = isSameDay(day, today);
                  const inMonth = isSameMonth(day, calMonth);
                  const hasPlan2 = weekPlanDates.has(val);
                  return (
                    <button
                      key={val}
                      onClick={() => { setPlanDate(val); }}
                      className={`aspect-square rounded-lg text-center font-body text-xs transition-colors relative flex items-center justify-center ${
                        !inMonth
                          ? "text-muted-foreground/30"
                          : isSelected
                            ? "bg-primary text-primary-foreground"
                            : isToday2
                              ? "bg-secondary text-foreground ring-1 ring-primary/40"
                              : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {format(day, "d")}
                      {hasPlan2 && !isSelected && inMonth && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {dateOptions.map((d) => {
            const isSelected = planDate === d.value;
            const isToday = isSameDay(d.date, today);
            const hasPlan = weekPlanDates.has(d.value);
            return (
              <button
                key={d.value}
                onClick={() => setPlanDate(d.value)}
                className={`shrink-0 px-3 py-2 rounded-lg text-center transition-colors relative ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "bg-secondary text-foreground border border-primary/30"
                      : "bg-card border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span className="font-display text-xs block">{format(d.date, "EEE")}</span>
                <span className="font-body text-xs">{format(d.date, "d")}</span>
                {hasPlan && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Time & Notes */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">START TIME <span className="text-destructive">*</span></label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-1 block">END TIME <span className="text-destructive">*</span></label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <input
          placeholder="Plan notes (optional)..."
          value={planNotes}
          onChange={(e) => setPlanNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Location fields */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            placeholder="Location name (e.g. Padel Club)"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Address (for Google Maps)"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Latitude (optional)"
            type="number"
            step="any"
            value={locationLat}
            onChange={(e) => setLocationLat(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Longitude (optional)"
            type="number"
            step="any"
            value={locationLng}
            onChange={(e) => setLocationLng(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Module browser — on mobile appears before plan items, on desktop after */}
        {renderModuleBrowser()}

        {/* Plan items — dnd-kit reorderable */}
        {planItems.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={planItems.map((i) => i.tempId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mb-4">
                {planItems.map((item) => (
                  <SortablePlanItem key={item.tempId} item={item} onRemove={removeItem} onNoteChange={updateNote} onDurationChange={updateDuration} onDurationSave={saveDurationToDB} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Inline add module row */}
        {user && (
          <div className="mb-4">
            <InlineAddModule onAdd={handleInlineAdd} userId={user.id} />
          </div>
        )}

        {/* Summary & Save */}
        {planItems.length > 0 && (
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <p className="font-body text-sm text-muted-foreground">
              {planItems.length} modules · {totalDuration} min total
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saved ? <><Check size={16} /> SAVED</> : saving ? "SAVING..." : <><Save size={16} /> SAVE PLAN</>}
            </button>
          </div>
        )}

        {/* Module picker modal (search) */}
        {showModulePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => { setShowModulePicker(false); setModuleSearch(""); setModuleCategory("all"); }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[70vh] bg-card border border-border rounded-t-xl md:rounded-xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-lg text-foreground">SEARCH MODULES</h3>
                  <button onClick={() => { setShowModulePicker(false); setModuleSearch(""); setModuleCategory("all"); }}>
                    <X size={20} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setModuleCategory(key)}
                      className={`shrink-0 px-3 py-1 rounded-lg font-display text-xs tracking-wider transition-colors ${
                        moduleCategory === key
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    autoFocus
                    placeholder="Search modules..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-1">
                {filteredModules.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="font-body text-sm text-muted-foreground mb-3">
                      {moduleSearch ? "No modules match your search." : "No modules yet."}
                    </p>
                    {!moduleSearch && (
                      <button
                        onClick={() => { setShowModulePicker(false); navigate("/coach/modules"); }}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider"
                      >
                        CREATE FIRST MODULE
                      </button>
                    )}
                  </div>
                ) : (
                  filteredModules.map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => addModule(mod)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-all ${
                        justAddedId === mod.id ? "bg-green-500/20 ring-1 ring-green-500/40" : "hover:bg-secondary"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[mod.category] || "bg-muted"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-foreground truncate">{mod.title}</p>
                        <p className="text-[10px] font-body text-muted-foreground">{mod.category.replace("_", " ")} · {mod.duration_minutes || 0} min</p>
                      </div>
                      <Plus size={16} className="text-muted-foreground flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Save as block modal */}
      {showSaveBlock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowSaveBlock(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-xl p-5 space-y-4"
          >
            <h3 className="font-display text-lg text-foreground">SAVE AS TRAINING BLOCK</h3>
            <input
              placeholder="Block title..."
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="Short description..."
              value={blockDesc}
              onChange={(e) => setBlockDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div>
              <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">GOAL</p>
              <div className="flex flex-wrap gap-1.5">
                {["Technique", "Match Preparation", "Fitness", "Recovery", "Warm Up", "Footwork", "Mental", "Kids", "Beginner", "Advanced"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setBlockGoal(g)}
                    className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
                      blockGoal === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs font-body text-muted-foreground">{planItems.length} modules will be saved in this block</p>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveBlock(false)} className="flex-1 py-2.5 rounded-xl border border-border font-display text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                CANCEL
              </button>
              <button onClick={handleSaveAsBlock} className="flex-1 py-2.5 rounded-xl bg-primary font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors">
                SAVE BLOCK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Mobile: Training blocks button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setShowSaveBlock(true)}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          title="Save as block"
        >
          <Save size={20} />
        </button>
      </div>
      </div>
    </PortalLayout>
  );
};

export default CoachPlanBuilder;
