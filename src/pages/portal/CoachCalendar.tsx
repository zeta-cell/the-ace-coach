import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, Link } from "react-router-dom";
import PortalLayout from "@/components/portal/PortalLayout";
import CoachAvailabilityGrid from "@/components/portal/CoachAvailabilityGrid";
import CreateTrainingBlockDrawer from "@/components/portal/CreateTrainingBlockDrawer";
import QuickAddTrainingDrawer from "@/components/portal/QuickAddTrainingDrawer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, startOfWeek, endOfWeek,
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Users, Clock, ArrowLeft, Plus, X,
  Layers, Search, GripVertical, Trash2, Copy, Save, Dumbbell,
  Calendar as CalendarIcon, Edit3,
} from "lucide-react";

/* ── types ── */
interface DayPlan {
  id: string; plan_date: string; player_id: string; player_name: string;
  item_count: number; start_time: string | null; end_time: string | null;
  program_author?: string | null; program_title?: string | null; program_author_avatar?: string | null;
}

interface AssignedPlayer { player_id: string; full_name: string; }

interface TrainingBlock {
  id: string; title: string; description: string | null; category: string;
  sport: string; duration_minutes: number; difficulty: string; goals: string[];
  exercises: any[]; is_system: boolean; is_custom: boolean; coach_id: string | null;
  block_type: string; week_count: number; target_level: string | null;
  is_public: boolean; is_for_sale: boolean; price: number; currency: string;
}

interface PlanBlock { tempId: string; block: TrainingBlock; coach_note: string; block_id: string; }

interface BookingDot { id: string; booking_date: string; status: string; }

interface DayBookingDetail {
  id: string; booking_date: string; start_time: string; end_time: string;
  status: string; total_price: number; coach_payout: number; currency: string;
  player_name: string; player_avatar: string | null; player_id: string;
  package_title: string; location_type: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  warm_up: "WARM UP", padel_drill: "TECHNICAL", footwork: "FOOTWORK",
  fitness: "FITNESS", strength: "STRENGTH", mental: "MENTAL",
  recovery: "RECOVERY", nutrition: "NUTRITION", video: "VIDEO",
};

const CATEGORY_COLORS: Record<string, string> = {
  warm_up: "bg-red-500/20 text-red-400", padel_drill: "bg-cyan-500/20 text-cyan-400",
  footwork: "bg-blue-500/20 text-blue-400", fitness: "bg-orange-500/20 text-orange-400",
  strength: "bg-amber-500/20 text-amber-400", mental: "bg-purple-500/20 text-purple-400",
  recovery: "bg-green-500/20 text-green-400", nutrition: "bg-lime-500/20 text-lime-400",
  video: "bg-pink-500/20 text-pink-400",
};

const SPORT_COLORS: Record<string, string> = {
  tennis: "bg-emerald-500/20 text-emerald-400",
  padel: "bg-sky-500/20 text-sky-400",
  both: "bg-muted text-muted-foreground",
};

const BLOCK_CATEGORIES = ["All", "warm_up", "padel_drill", "footwork", "fitness", "strength", "mental", "recovery", "nutrition", "video"];

const formatTime = (t: string | null) => t ? t.slice(0, 5) : null;

const CoachCalendar = () => {
  const { user, role } = useAuth();
  const { coachId: paramCoachId } = useParams<{ coachId?: string }>();
  const navigate = useNavigate();

  const isAdminView = role === "admin" && !!paramCoachId;
  const targetCoachId = paramCoachId || user?.id;

  const [calendarTab, setCalendarTab] = useState<"bookings" | "availability">("bookings");
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [monthBookings, setMonthBookings] = useState<BookingDot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [coachName, setCoachName] = useState("");
  const [assignedPlayers, setAssignedPlayers] = useState<AssignedPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedDayBookings, setSelectedDayBookings] = useState<DayBookingDetail[]>([]);

  // Quick add
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | undefined>();

  // Training blocks
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(true);
  const [blockSearch, setBlockSearch] = useState("");
  const [blockCategory, setBlockCategory] = useState("All");
  const [blockTab, setBlockTab] = useState<"system" | "mine">("system");
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TrainingBlock | null>(null);

  // Day plan builder
  const [planBlocks, setPlanBlocks] = useState<PlanBlock[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [copyDateOpen, setCopyDateOpen] = useState(false);
  const [copyDate, setCopyDate] = useState("");

  // Drag state for plan reordering
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Drag from block library to plan
  const [draggingBlock, setDraggingBlock] = useState<TrainingBlock | null>(null);

  // Touch drag state
  const [touchDragIdx, setTouchDragIdx] = useState<number | null>(null);
  const [touchDragY, setTouchDragY] = useState(0);
  const touchStartRef = useRef<{ idx: number; y: number; height: number } | null>(null);

  useEffect(() => {
    if (targetCoachId) {
      fetchMonthPlans();
      fetchMonthBookings();
      if (!isAdminView) fetchAssignedPlayers();
    }
  }, [targetCoachId, currentMonth]);

  useEffect(() => { fetchBlocks(); }, [user]);

  useEffect(() => {
    if (isAdminView && paramCoachId) {
      supabase.from("profiles").select("full_name").eq("user_id", paramCoachId).single()
        .then(({ data }) => setCoachName(data?.full_name || "Coach"));
    }
  }, [isAdminView, paramCoachId]);

  const fetchAssignedPlayers = async () => {
    if (!targetCoachId) return;
    const { data: assignments } = await supabase
      .from("coach_player_assignments").select("player_id").eq("coach_id", targetCoachId);
    const ids = assignments?.map((a) => a.player_id) || [];
    if (ids.length === 0) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
    setAssignedPlayers(profiles?.map((p) => ({ player_id: p.user_id, full_name: p.full_name })) || []);
  };

  const fetchMonthPlans = async () => {
    if (!targetCoachId) return;
    setLoading(true);
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const { data: dayPlans } = await supabase
      .from("player_day_plans").select("plan_date, player_id, id, start_time, end_time")
      .eq("coach_id", targetCoachId).gte("plan_date", start).lte("plan_date", end);

    if (!dayPlans || dayPlans.length === 0) { setPlans([]); setLoading(false); return; }

    const playerIds = [...new Set(dayPlans.map(p => p.player_id))];
    const [profilesRes, itemsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", playerIds),
      supabase.from("player_day_plan_items").select("plan_id, block_id").in("plan_id", dayPlans.map(p => p.id)),
    ]);

    const nameMap = new Map(profilesRes.data?.map(p => [p.user_id, p.full_name]) || []);
    const countMap = new Map<string, number>();
    const planBlockIds = new Map<string, string>();
    (itemsRes.data as any[])?.forEach((item: any) => {
      countMap.set(item.plan_id, (countMap.get(item.plan_id) || 0) + 1);
      if (item.block_id && !planBlockIds.has(item.plan_id)) planBlockIds.set(item.plan_id, item.block_id);
    });

    const uniqueBlockIds = [...new Set(planBlockIds.values())];
    let blockAuthorMap = new Map<string, { title: string; author_name: string | null; author_avatar_url: string | null; author_id: string | null }>();
    if (uniqueBlockIds.length > 0) {
      const { data: blockData } = await supabase.from("training_blocks")
        .select("id, title, author_name, author_avatar_url, author_id")
        .in("id", uniqueBlockIds);
      blockData?.forEach(b => blockAuthorMap.set(b.id, { title: b.title, author_name: b.author_name, author_avatar_url: b.author_avatar_url, author_id: b.author_id }));
    }

    const result: DayPlan[] = dayPlans.map(p => {
      const blockId = planBlockIds.get(p.id);
      const blockInfo = blockId ? blockAuthorMap.get(blockId) : null;
      const isExternalAuthor = blockInfo && blockInfo.author_id && blockInfo.author_id !== targetCoachId;
      return {
        id: p.id, plan_date: p.plan_date, player_id: p.player_id,
        player_name: nameMap.get(p.player_id) || "Unknown",
        item_count: countMap.get(p.id) || 0,
        start_time: p.start_time || null, end_time: p.end_time || null,
        program_author: isExternalAuthor ? blockInfo!.author_name : null,
        program_title: isExternalAuthor ? blockInfo!.title : null,
        program_author_avatar: isExternalAuthor ? blockInfo!.author_avatar_url : null,
      };
    });
    result.sort((a, b) => (a.start_time || "99:99").localeCompare(b.start_time || "99:99"));
    setPlans(result);
    setLoading(false);
  };

  const fetchMonthBookings = async () => {
    if (!targetCoachId) return;
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_date, status")
      .eq("coach_id", targetCoachId)
      .gte("booking_date", start)
      .lte("booking_date", end)
      .in("status", ["confirmed", "pending"]);
    setMonthBookings((data as BookingDot[]) || []);
  };

  const fetchBlocks = async () => {
    setBlocksLoading(true);
    let query = supabase.from("training_blocks").select("*");
    if (user) {
      query = query.or(`is_system.eq.true,coach_id.eq.${user.id}`);
    } else {
      query = query.eq("is_system", true);
    }
    const { data } = await query.order("category").order("title");
    setBlocks((data as any as TrainingBlock[]) || []);
    setBlocksLoading(false);
  };

  const filteredBlocks = useMemo(() => {
    let result = blocks.filter((b) => blockTab === "system" ? b.is_system : !b.is_system);
    if (blockCategory !== "All") result = result.filter((b) => b.category === blockCategory);
    if (blockSearch.trim()) {
      const q = blockSearch.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
    }
    return result;
  }, [blocks, blockTab, blockCategory, blockSearch]);

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getPlansForDay = (date: Date) => plans.filter(p => p.plan_date === format(date, "yyyy-MM-dd"));
  const getBookingsForDay = (date: Date) => monthBookings.filter(b => b.booking_date === format(date, "yyyy-MM-dd"));
  const selectedDayPlans = selectedDay ? plans.filter(p => p.plan_date === selectedDay) : [];
  const totalDuration = planBlocks.reduce((s, pb) => s + (pb.block.duration_minutes || 0), 0);

  const addBlockToPlan = (block: TrainingBlock) => {
    if (!selectedDay) { toast.error("Select a day first"); return; }
    setPlanBlocks((prev) => [...prev, { tempId: crypto.randomUUID(), block, coach_note: "", block_id: block.id }]);
    toast.success(`Added "${block.title}"`);
  };

  const removeBlockFromPlan = (tempId: string) => setPlanBlocks((prev) => prev.filter((pb) => pb.tempId !== tempId));

  const updatePlanBlockNote = (tempId: string, note: string) => {
    setPlanBlocks((prev) => prev.map((pb) => pb.tempId === tempId ? { ...pb, coach_note: note } : pb));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      setPlanBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(dragOverIdx, 0, moved);
        return next;
      });
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleTouchStart = (idx: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    touchStartRef.current = { idx, y: touch.clientY, height: target.offsetHeight };
    setTouchDragIdx(idx);
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    setTouchDragY(deltaY);
    const moveBySlots = Math.round(deltaY / (touchStartRef.current.height + 8));
    const newIdx = Math.max(0, Math.min(planBlocks.length - 1, touchStartRef.current.idx + moveBySlots));
    setDragOverIdx(newIdx);
  }, [planBlocks.length]);

  const handleTouchEnd = () => {
    if (touchStartRef.current !== null && touchDragIdx !== null && dragOverIdx !== null && touchDragIdx !== dragOverIdx) {
      setPlanBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(touchDragIdx, 1);
        next.splice(dragOverIdx, 0, moved);
        return next;
      });
    }
    setTouchDragIdx(null);
    setTouchDragY(0);
    setDragOverIdx(null);
    touchStartRef.current = null;
  };

  const handleBlockDragStart = (e: React.DragEvent, block: TrainingBlock) => {
    setDraggingBlock(block);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handlePlanDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingBlock) {
      addBlockToPlan(draggingBlock);
      setDraggingBlock(null);
    }
  };

  const handlePlanDragOver = (e: React.DragEvent) => {
    if (draggingBlock) e.preventDefault();
  };

  const handleSavePlan = async () => {
    if (!selectedDay || !selectedPlayerId || !targetCoachId || planBlocks.length === 0) {
      toast.error("Select a player and add at least one block"); return;
    }
    setSavingPlan(true);
    const { data: existingPlans } = await supabase
      .from("player_day_plans").select("id")
      .eq("coach_id", targetCoachId).eq("player_id", selectedPlayerId).eq("plan_date", selectedDay);

    let planId: string;
    if (existingPlans && existingPlans.length > 0) {
      planId = existingPlans[0].id;
      await supabase.from("player_day_plan_items").delete().eq("plan_id", planId);
      await supabase.from("player_day_plans").update({
        notes: planBlocks.map((pb) => pb.block.title).join(", "),
        start_time: "09:00",
        end_time: format(new Date(2000, 0, 1, 9, totalDuration), "HH:mm"),
      }).eq("id", planId);
    } else {
      const { data: newPlan, error } = await supabase.from("player_day_plans").insert({
        coach_id: targetCoachId, player_id: selectedPlayerId, plan_date: selectedDay,
        notes: planBlocks.map((pb) => pb.block.title).join(", "),
        start_time: "09:00",
        end_time: format(new Date(2000, 0, 1, 9, totalDuration), "HH:mm"),
      }).select("id").single();
      if (error || !newPlan) { toast.error("Failed to create plan"); setSavingPlan(false); return; }
      planId = newPlan.id;
    }

    for (let i = 0; i < planBlocks.length; i++) {
      const pb = planBlocks[i];
      const { data: mod } = await supabase.from("modules").insert({
        title: pb.block.title, category: (pb.block.category as any) || "padel_drill",
        created_by: targetCoachId, duration_minutes: pb.block.duration_minutes,
        description: pb.block.description, is_shared: false,
      }).select("id").single();
      if (mod) {
        await supabase.from("player_day_plan_items").insert({
          plan_id: planId, module_id: mod.id, order_index: i, coach_note: pb.coach_note || null,
          block_id: pb.block_id || null,
        } as any);
      }
    }

    toast.success("Plan saved!");
    setSavingPlan(false);
    fetchMonthPlans();
  };

  const handleCopyPlan = async () => {
    if (!copyDate || !selectedPlayerId || !targetCoachId || planBlocks.length === 0) return;
    setCopyDateOpen(false);
    const { data: newPlan } = await supabase.from("player_day_plans").insert({
      coach_id: targetCoachId, player_id: selectedPlayerId, plan_date: copyDate,
      notes: planBlocks.map((pb) => pb.block.title).join(", "),
      start_time: "09:00",
      end_time: format(new Date(2000, 0, 1, 9, totalDuration), "HH:mm"),
    }).select("id").single();
    if (newPlan) {
      for (let i = 0; i < planBlocks.length; i++) {
        const pb = planBlocks[i];
        const { data: mod } = await supabase.from("modules").insert({
          title: pb.block.title, category: (pb.block.category as any) || "padel_drill",
          created_by: targetCoachId, duration_minutes: pb.block.duration_minutes,
          description: pb.block.description, is_shared: false,
        }).select("id").single();
        if (mod) {
          await supabase.from("player_day_plan_items").insert({
            plan_id: newPlan.id, module_id: mod.id, order_index: i, coach_note: pb.coach_note || null,
            block_id: pb.block_id || null,
          } as any);
        }
      }
      toast.success(`Plan copied to ${copyDate}`);
      fetchMonthPlans();
    }
  };

  const handleSaveAsBlock = async () => {
    if (!user || planBlocks.length === 0) return;
    const blockTitle = prompt("Enter block name:");
    if (!blockTitle) return;
    await supabase.from("training_blocks").insert({
      coach_id: user.id, title: blockTitle,
      description: `Custom block with ${planBlocks.length} activities`,
      category: planBlocks[0].block.category || "padel_drill", sport: "both",
      duration_minutes: totalDuration, difficulty: "intermediate", goals: [],
      exercises: planBlocks.map((pb) => ({ name: pb.block.title, notes: pb.coach_note, duration_min: pb.block.duration_minutes })) as any,
      is_system: false, is_custom: true, goal: "Custom",
      module_ids: [], module_durations: planBlocks.map((pb) => pb.block.duration_minutes),
      module_notes: planBlocks.map((pb) => pb.coach_note),
    } as any);
    toast.success("Saved as custom block!");
    fetchBlocks();
  };

  const handleDayClick = (dateStr: string) => {
    if (selectedDay === dateStr) {
      setSelectedDay(null); setPlanBlocks([]); setSelectedPlayerId(null);
    } else {
      setSelectedDay(dateStr); setPlanBlocks([]); setSelectedPlayerId(null);
    }
  };

  const handleEditBlock = (block: TrainingBlock) => {
    setEditingBlock(block);
    setCreateBlockOpen(true);
  };

  const handleQuickAdd = (dateStr: string) => {
    setQuickAddDate(dateStr);
    setQuickAddOpen(true);
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Availability grid */}
        {!isAdminView && targetCoachId && <CoachAvailabilityGrid coachId={targetCoachId} />}

        {/* Header */}
        <div className="space-y-4">
          {isAdminView && (
            <Link to="/admin/schedule" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm transition-colors">
              <ArrowLeft size={16} /> Back to Schedule
            </Link>
          )}
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl md:text-3xl text-foreground tracking-wider">
              {isAdminView ? `${coachName.toUpperCase()}'S SCHEDULE` : "MY SCHEDULE"}
            </h1>
            {/* View mode toggle */}
            <div className="flex gap-0.5 bg-secondary rounded-lg p-0.5">
              {(["week", "month"] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md font-display text-[10px] tracking-wider transition-colors ${
                    viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Three column layout */}
        <div className="flex gap-4">
          {/* LEFT — Training Blocks Library */}
          <aside className="hidden lg:block w-[280px] shrink-0 space-y-3">
            <div className="bg-card border border-border rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-none">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={16} className="text-primary" />
                <h3 className="font-display text-xs tracking-wider text-foreground">TRAINING BLOCKS</h3>
              </div>

              <div className="relative mb-3">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input placeholder="Search blocks..." value={blockSearch} onChange={(e) => setBlockSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
              </div>

              <div className="flex gap-1 mb-3 bg-secondary rounded-lg p-0.5">
                {(["system", "mine"] as const).map((tab) => (
                  <button key={tab} onClick={() => setBlockTab(tab)}
                    className={`flex-1 py-1.5 rounded-md font-display text-[10px] tracking-wider transition-colors ${
                      blockTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >{tab === "system" ? "SYSTEM" : "MY BLOCKS"}</button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {BLOCK_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setBlockCategory(cat)}
                    className={`px-2 py-1 rounded-md font-display text-[9px] tracking-wider transition-colors ${
                      blockCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >{cat === "All" ? "ALL" : CATEGORY_LABELS[cat] || cat.toUpperCase()}</button>
                ))}
              </div>

              {blocksLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
              ) : (
                <div className="space-y-2">
                  {filteredBlocks.map((block) => (
                    <div key={block.id}
                      draggable
                      onDragStart={(e) => handleBlockDragStart(e, block)}
                      onDragEnd={() => setDraggingBlock(null)}
                      className="p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <GripVertical size={12} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <p className="font-display text-xs text-foreground truncate">{block.title}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {!block.is_system && (
                            <button onClick={(e) => { e.stopPropagation(); handleEditBlock(block); }}
                              className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit3 size={11} />
                            </button>
                          )}
                          <button onClick={() => addBlockToPlan(block)}
                            className="p-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-display tracking-wider ${CATEGORY_COLORS[block.category] || "bg-muted text-muted-foreground"}`}>
                          {CATEGORY_LABELS[block.category] || block.category}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-display tracking-wider ${SPORT_COLORS[block.sport] || "bg-muted text-muted-foreground"}`}>
                          {block.sport?.toUpperCase()}
                        </span>
                        <span className="text-[9px] font-body text-muted-foreground">{block.duration_minutes}min</span>
                      </div>
                      {block.goals && block.goals.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {(block.goals as string[]).slice(0, 2).map((g) => (
                            <span key={g} className="px-1.5 py-0.5 rounded bg-muted text-[8px] font-body text-muted-foreground">{g}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredBlocks.length === 0 && (
                    <p className="text-xs font-body text-muted-foreground text-center py-6">No blocks found</p>
                  )}
                </div>
              )}

              <button onClick={() => { setEditingBlock(null); setCreateBlockOpen(true); }}
                className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground font-display text-[10px] tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                <Plus size={12} /> CREATE CUSTOM BLOCK
              </button>
            </div>
          </aside>

          {/* CENTER — Calendar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                className="p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-display text-sm tracking-wider text-foreground min-w-[160px] text-center">
                {format(currentMonth, "MMMM yyyy").toUpperCase()}
              </span>
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                className="p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
                <div key={d} className="text-center font-display text-[10px] tracking-wider text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const dayPlans = getPlansForDay(day);
                const dayBookings = getBookingsForDay(day);
                const dateStr = format(day, "yyyy-MM-dd");
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDay === dateStr;
                const hasPlans = dayPlans.length > 0;
                const hasBookings = dayBookings.length > 0;
                const today = isToday(day);

                return (
                  <div key={dateStr} onClick={() => handleDayClick(dateStr)}
                    className={`min-h-[72px] md:min-h-[80px] p-1.5 rounded-xl border cursor-pointer transition-all group/cell relative
                      ${!isCurrentMonth ? "opacity-30" : ""}
                      ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}
                      ${today ? "ring-1 ring-primary/50" : ""}
                    `}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-display ${today ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</span>
                      {/* Plus button */}
                      {isCurrentMonth && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQuickAdd(dateStr); }}
                          className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover/cell:opacity-100 md:opacity-0 transition-opacity"
                          style={{ fontSize: 10 }}
                        >
                          <Plus size={10} />
                        </button>
                      )}
                    </div>
                    {/* Dots */}
                    <div className="flex items-center gap-0.5 flex-wrap mb-0.5">
                      {dayBookings.slice(0, 3).map((b, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[7px] font-body text-blue-400">+{dayBookings.length - 3}</span>
                      )}
                      {dayPlans.slice(0, 3).map((_, i) => (
                        <div key={`p-${i}`} className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      ))}
                      {dayPlans.length > 3 && (
                        <span className="text-[7px] font-body text-green-400">+{dayPlans.length - 3}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayPlans.slice(0, 2).map((plan, i) => (
                        <div key={i} className="text-[8px] font-body text-muted-foreground truncate">
                          <span className="text-primary/70">{formatTime(plan.start_time) || "—"}</span>{" "}
                          {plan.player_name.split(" ")[0]}
                        </div>
                      ))}
                      {dayPlans.length > 2 && <div className="text-[8px] font-body text-primary">+{dayPlans.length - 2} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Day Training Creator */}
          <AnimatePresence>
            {selectedDay && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }} animate={{ width: 380, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                className="hidden md:block shrink-0 overflow-hidden"
              >
                <div className="w-[380px] bg-card border border-border rounded-2xl p-4 sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-none space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-xs tracking-wider text-foreground">
                        TRAINING PLAN — {format(new Date(selectedDay + "T00:00:00"), "EEE d MMM").toUpperCase()}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedDay(null); setPlanBlocks([]); setSelectedPlayerId(null); }}
                      className="p-1 rounded-lg hover:bg-secondary"><X size={16} /></button>
                  </div>

                  <div>
                    <label className="font-display text-[10px] tracking-wider text-muted-foreground">PLAYER</label>
                    <select value={selectedPlayerId || ""} onChange={(e) => setSelectedPlayerId(e.target.value || null)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Select player...</option>
                      {assignedPlayers.map((p) => <option key={p.player_id} value={p.player_id}>{p.full_name}</option>)}
                    </select>
                  </div>

                  {selectedDayPlans.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="font-display text-[10px] tracking-wider text-muted-foreground">EXISTING SESSIONS</p>
                      {selectedDayPlans.map((plan) => (
                        <div key={plan.id} onClick={() => navigate(`/coach/plan/${plan.player_id}?date=${selectedDay}`)}
                          className="flex items-center gap-2 p-2 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-display text-[9px]">{plan.player_name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-display text-foreground truncate">{plan.player_name}</p>
                          <p className="text-[9px] font-body text-muted-foreground">
                              {formatTime(plan.start_time) || "—"} · {plan.item_count} modules
                            </p>
                            {plan.program_author && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {plan.program_author_avatar ? (
                                  <img src={plan.program_author_avatar} className="w-3 h-3 rounded-full" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-[6px]">
                                    {plan.program_author.charAt(0)}
                                  </div>
                                )}
                                <span className="font-body text-[8px] text-muted-foreground">
                                  Program by {plan.program_author}
                                </span>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={14} className="text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Plan builder - drop zone */}
                  <div onDrop={handlePlanDrop} onDragOver={handlePlanDragOver}>
                    <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">
                      {planBlocks.length > 0 ? `NEW PLAN (${planBlocks.length} BLOCKS)` : "BUILD NEW PLAN"}
                    </p>

                    {planBlocks.length === 0 ? (
                      <div className={`text-center py-8 border border-dashed rounded-xl transition-colors ${draggingBlock ? "border-primary bg-primary/5" : "border-border"}`}>
                        <Dumbbell size={24} className="text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs font-body text-muted-foreground">
                          {draggingBlock ? "Drop here to add" : "Drag a block or click + from the left panel"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {planBlocks.map((pb, idx) => (
                          <div key={pb.tempId}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            onTouchStart={(e) => handleTouchStart(idx, e)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{
                              transform: touchDragIdx === idx ? `translateY(${touchDragY}px)` : undefined,
                              zIndex: touchDragIdx === idx ? 10 : undefined,
                              position: touchDragIdx === idx ? "relative" : undefined,
                            }}
                            className={`p-3 rounded-lg border bg-secondary space-y-2 cursor-grab active:cursor-grabbing transition-all touch-none ${
                              dragOverIdx === idx ? "border-primary bg-primary/5" : "border-border"
                            } ${dragIdx === idx || touchDragIdx === idx ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical size={14} className="text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-display text-xs text-foreground truncate">{pb.block.title}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-display ${CATEGORY_COLORS[pb.block.category] || "bg-muted text-muted-foreground"}`}>
                                    {CATEGORY_LABELS[pb.block.category] || pb.block.category}
                                  </span>
                                  <span className="text-[9px] font-body text-muted-foreground">{pb.block.duration_minutes}min</span>
                                </div>
                              </div>
                              <button onClick={() => removeBlockFromPlan(pb.tempId)}
                                className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                            </div>
                            <textarea value={pb.coach_note} onChange={(e) => updatePlanBlockNote(pb.tempId, e.target.value)}
                              placeholder="Coach note..." rows={1}
                              className="w-full px-2 py-1.5 rounded bg-card border border-border text-foreground font-body text-[10px] focus:outline-none resize-none" />
                          </div>
                        ))}

                        {draggingBlock && (
                          <div className="text-center py-3 border border-dashed border-primary rounded-xl bg-primary/5">
                            <p className="text-[10px] font-body text-primary">Drop here to add</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {planBlocks.length > 0 && (
                    <div className="flex items-center justify-between py-2 border-t border-border">
                      <span className="font-display text-[10px] tracking-wider text-muted-foreground">TOTAL DURATION</span>
                      <span className="font-display text-sm text-primary">{totalDuration} MIN</span>
                    </div>
                  )}

                  {planBlocks.length > 0 && (
                    <div className="space-y-2">
                      <button onClick={handleSavePlan} disabled={savingPlan || !selectedPlayerId}
                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        {savingPlan ? "SAVING..." : "SAVE PLAN"}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => setCopyDateOpen(true)}
                          className="flex-1 py-2 rounded-xl border border-border font-display text-[10px] tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-1">
                          <Copy size={12} /> COPY PLAN
                        </button>
                        <button onClick={handleSaveAsBlock}
                          className="flex-1 py-2 rounded-xl border border-border font-display text-[10px] tracking-wider text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-1">
                          <Save size={12} /> SAVE AS BLOCK
                        </button>
                      </div>

                      {copyDateOpen && (
                        <div className="p-3 rounded-lg bg-secondary border border-border space-y-2">
                          <p className="font-display text-[10px] tracking-wider text-muted-foreground">COPY TO DATE</p>
                          <input type="date" value={copyDate} onChange={(e) => setCopyDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none" />
                          <div className="flex gap-2">
                            <button onClick={() => setCopyDateOpen(false)}
                              className="flex-1 py-1.5 rounded-lg border border-border text-xs font-body text-muted-foreground">Cancel</button>
                            <button onClick={handleCopyPlan} disabled={!copyDate}
                              className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display disabled:opacity-50">COPY</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile bottom panel — day detail */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto"
            >
              <div className="p-4 space-y-3">
                {/* Handle bar */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto" />

                <div className="flex items-center justify-between">
                  <p className="font-display text-sm tracking-wider text-foreground">
                    {format(new Date(selectedDay + "T00:00:00"), "EEEE d MMM").toUpperCase()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickAdd(selectedDay)}
                      className="p-1.5 rounded-lg bg-primary text-primary-foreground"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => { setSelectedDay(null); setPlanBlocks([]); setSelectedPlayerId(null); }}
                      className="p-1.5 rounded-lg hover:bg-secondary"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {selectedDayPlans.length === 0 ? (
                  <div className="text-center py-6">
                    <Dumbbell size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-body text-muted-foreground">No sessions scheduled</p>
                    <button
                      onClick={() => handleQuickAdd(selectedDay)}
                      className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider"
                    >
                      ADD TRAINING
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayPlans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => navigate(`/coach/plan/${plan.player_id}?date=${selectedDay}`)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary font-display text-sm">{plan.player_name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-display text-foreground truncate">{plan.player_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {plan.start_time && (
                              <span className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                                <Clock size={11} className="text-primary" />
                                {formatTime(plan.start_time)}
                                {plan.end_time ? ` – ${formatTime(plan.end_time)}` : ""}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                              <Dumbbell size={11} className="text-primary" />
                              {plan.item_count} modules
                            </span>
                          </div>
                          {plan.program_author && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {plan.program_author_avatar ? (
                                <img src={plan.program_author_avatar} className="w-3.5 h-3.5 rounded-full" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-[7px]">
                                  {plan.program_author.charAt(0)}
                                </div>
                              )}
                              <span className="font-body text-[10px] text-muted-foreground">
                                Program by {plan.program_author}
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateTrainingBlockDrawer
        open={createBlockOpen}
        onClose={() => { setCreateBlockOpen(false); setEditingBlock(null); }}
        onCreated={fetchBlocks}
        editBlock={editingBlock}
      />

      <QuickAddTrainingDrawer
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        prefilledDate={quickAddDate}
        onSaved={() => { setQuickAddOpen(false); fetchMonthPlans(); fetchMonthBookings(); }}
      />
    </PortalLayout>
  );
};

export default CoachCalendar;
