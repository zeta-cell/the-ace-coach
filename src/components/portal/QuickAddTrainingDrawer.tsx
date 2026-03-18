import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Search, Layers, BookOpen, Plus, Check, ArrowLeft, ArrowRight, Clock, User, CalendarDays, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

interface AssignedPlayer {
  player_id: string;
  full_name: string;
}

interface TrainingBlock {
  id: string;
  title: string;
  category: string;
  duration_minutes: number;
  module_ids: string[];
  module_durations: number[];
  module_notes: string[];
}

interface ModuleItem {
  id: string;
  title: string;
  category: string;
  duration_minutes: number | null;
}

interface QuickAddTrainingDrawerProps {
  open: boolean;
  onClose: () => void;
  prefilledDate?: string;
  prefilledPlayerId?: string;
  onSaved?: () => void;
}

const CATEGORY_FILTERS = ["All", "Padel", "Tennis", "Mental", "Fitness", "Tactical", "Recovery"] as const;

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  warm_up: "border-l-yellow-500", padel_drill: "border-l-cyan-500", padel: "border-l-cyan-500",
  footwork: "border-l-blue-500", fitness: "border-l-orange-500", strength: "border-l-orange-600",
  mental: "border-l-purple-500", recovery: "border-l-green-500", cool_down: "border-l-teal-500",
  nutrition: "border-l-lime-500", video: "border-l-pink-500", tennis: "border-l-emerald-500",
  tactical: "border-l-amber-500", technique: "border-l-primary", general: "border-l-muted-foreground",
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
  warm_up: "bg-yellow-500", padel_drill: "bg-cyan-500", padel: "bg-cyan-500",
  footwork: "bg-blue-500", fitness: "bg-orange-500", strength: "bg-orange-600",
  mental: "bg-purple-500", recovery: "bg-green-500", cool_down: "bg-teal-500",
  nutrition: "bg-lime-500", video: "bg-pink-500", tennis: "bg-emerald-500",
  tactical: "bg-amber-500", technique: "bg-primary", general: "bg-muted-foreground",
};

const QuickAddTrainingDrawer = ({
  open, onClose, prefilledDate, prefilledPlayerId, onSaved,
}: QuickAddTrainingDrawerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"select" | "review">("select");
  const [date, setDate] = useState(prefilledDate || format(new Date(), "yyyy-MM-dd"));
  const [playerId, setPlayerId] = useState(prefilledPlayerId || "");
  const [assignType, setAssignType] = useState<"block" | "modules">("block");
  const [players, setPlayers] = useState<AssignedPlayer[]>([]);
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchPlayers();
      fetchBlocks();
      fetchModules();
      setStep("select");
    }
  }, [open, user]);

  useEffect(() => { if (prefilledDate) setDate(prefilledDate); }, [prefilledDate]);
  useEffect(() => { if (prefilledPlayerId) setPlayerId(prefilledPlayerId); }, [prefilledPlayerId]);

  const fetchPlayers = async () => {
    if (!user) return;
    const { data: assignments } = await supabase
      .from("coach_player_assignments").select("player_id").eq("coach_id", user.id);
    const ids = assignments?.map(a => a.player_id) || [];
    if (ids.length === 0) return;
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, full_name").in("user_id", ids);
    setPlayers(profiles?.map(p => ({ player_id: p.user_id, full_name: p.full_name })) || []);
  };

  const fetchBlocks = async () => {
    if (!user) return;
    const { data } = await supabase.from("training_blocks")
      .select("id, title, category, duration_minutes, module_ids, module_durations, module_notes")
      .or(`is_system.eq.true,coach_id.eq.${user.id}`)
      .order("title");
    setBlocks((data as any as TrainingBlock[]) || []);
  };

  const fetchModules = async () => {
    if (!user) return;
    const { data } = await supabase.from("modules")
      .select("id, title, category, duration_minutes")
      .or(`created_by.eq.${user.id},is_shared.eq.true`)
      .order("category");
    setModules((data as ModuleItem[]) || []);
  };

  const toggleModule = (id: string) => {
    setSelectedModuleIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const removeModule = (id: string) => {
    setSelectedModuleIds(prev => prev.filter(moduleId => moduleId !== id));
  };

  const clearSelection = () => {
    setSelectedBlockId("");
    setSelectedModuleIds([]);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedModules = modules.filter(m => selectedModuleIds.includes(m.id));
  const playerName = players.find(p => p.player_id === playerId)?.full_name || "—";

  const totalDuration = assignType === "block"
    ? (selectedBlock?.duration_minutes || 0)
    : selectedModules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0);

  const canProceedToReview = playerId && date && (
    (assignType === "block" && selectedBlockId) ||
    (assignType === "modules" && selectedModuleIds.length > 0)
  );

  const handleReview = () => {
    if (!canProceedToReview) {
      toast.error("Select a player, date, and training content");
      return;
    }
    setStep("review");
  };

  const handleSave = async () => {
    if (!user || !playerId || !date) return;
    setSaving(true);

    if (assignType === "block" && selectedBlock) {
      const { data: plan } = await supabase.from("player_day_plans").insert({
        coach_id: user.id, player_id: playerId, plan_date: date,
        notes: selectedBlock.title, start_time: "09:00",
      }).select("id").single();

      if (plan && selectedBlock.module_ids?.length > 0) {
        for (let i = 0; i < selectedBlock.module_ids.length; i++) {
          await supabase.from("player_day_plan_items").insert({
            plan_id: plan.id,
            module_id: selectedBlock.module_ids[i],
            order_index: i,
            coach_note: selectedBlock.module_notes?.[i] || null,
            block_id: selectedBlock.id,
          });
        }
      }
    } else if (assignType === "modules" && selectedModuleIds.length > 0) {
      const { data: plan } = await supabase.from("player_day_plans").insert({
        coach_id: user.id, player_id: playerId, plan_date: date,
        notes: `${selectedModuleIds.length} modules`, start_time: "09:00",
      }).select("id").single();

      if (plan) {
        for (let i = 0; i < selectedModuleIds.length; i++) {
          await supabase.from("player_day_plan_items").insert({
            plan_id: plan.id,
            module_id: selectedModuleIds[i],
            order_index: i,
          });
        }
      }
    }

    // Notify player
    await supabase.from("notifications").insert({
      user_id: playerId,
      title: "New training assigned",
      body: `Your coach assigned training for ${format(new Date(date + "T00:00:00"), "d MMM yyyy")}`,
      link: `/training?date=${date}`,
    });

    toast.success("Training assigned!", { duration: 1500 });
    setSaving(false);
    onSaved?.();

    // Reset state
    setSelectedBlockId("");
    setSelectedModuleIds([]);
    setSearch("");
    setStep("select");

    // Close and navigate to the player's training page
    onClose();
    navigate(`/training?date=${date}&player=${playerId}`);
  };

  const matchesCategory = (cat: string) => {
    if (categoryFilter === "All") return true;
    return cat.toLowerCase().includes(categoryFilter.toLowerCase());
  };

  const filteredBlocks = blocks.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) && matchesCategory(b.category)
  );

  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) && matchesCategory(m.category)
  );

  const handleClose = () => {
    setStep("select");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                {step === "review" ? (
                  <button onClick={() => setStep("select")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={16} />
                    <span className="font-display text-[10px] tracking-wider">BACK</span>
                  </button>
                ) : (
                  <h2 className="font-display text-lg tracking-wider text-foreground">CREATE TRAINING</h2>
                )}
                <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              {step === "select" ? (
                <SelectionStep
                  date={date} setDate={setDate}
                  playerId={playerId} setPlayerId={setPlayerId}
                  prefilledPlayerId={prefilledPlayerId}
                  players={players}
                  assignType={assignType} setAssignType={setAssignType}
                  search={search} setSearch={setSearch}
                  categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                  filteredBlocks={filteredBlocks} filteredModules={filteredModules}
                  selectedBlockId={selectedBlockId} setSelectedBlockId={setSelectedBlockId}
                  selectedModuleIds={selectedModuleIds} toggleModule={toggleModule}
                  selectedBlock={selectedBlock}
                  selectedModules={selectedModules}
                  totalDuration={totalDuration}
                  onRemoveModule={removeModule}
                  onClearSelection={clearSelection}
                  canProceed={!!canProceedToReview}
                  onNext={handleReview}
                />
              ) : (
                <ReviewStep
                  playerName={playerName}
                  date={date}
                  assignType={assignType}
                  selectedBlock={selectedBlock}
                  selectedModules={selectedModules}
                  totalDuration={totalDuration}
                  saving={saving}
                  onConfirm={handleSave}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── Step 1: Selection ─── */
interface SelectionStepProps {
  date: string; setDate: (v: string) => void;
  playerId: string; setPlayerId: (v: string) => void;
  prefilledPlayerId?: string;
  players: AssignedPlayer[];
  assignType: "block" | "modules"; setAssignType: (v: "block" | "modules") => void;
  search: string; setSearch: (v: string) => void;
  categoryFilter: string; setCategoryFilter: (v: string) => void;
  filteredBlocks: TrainingBlock[]; filteredModules: ModuleItem[];
  selectedBlockId: string; setSelectedBlockId: (v: string) => void;
  selectedModuleIds: string[]; toggleModule: (id: string) => void;
  selectedBlock?: TrainingBlock;
  selectedModules: ModuleItem[];
  totalDuration: number;
  onRemoveModule: (id: string) => void;
  onClearSelection: () => void;
  canProceed: boolean;
  onNext: () => void;
}

const SelectionStep = ({
  date, setDate, playerId, setPlayerId, prefilledPlayerId, players,
  assignType, setAssignType, search, setSearch, categoryFilter, setCategoryFilter,
  filteredBlocks, filteredModules, selectedBlockId, setSelectedBlockId,
  selectedModuleIds, toggleModule, selectedBlock, selectedModules, totalDuration,
  onRemoveModule, onClearSelection, canProceed, onNext,
}: SelectionStepProps) => {
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  return (
  <>
    {/* Date */}
    <div>
      <label className="font-display text-[10px] tracking-wider text-muted-foreground block mb-1">DATE</label>
      <input
        type="date" value={date} onChange={e => setDate(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>

    {/* Player */}
    <div>
      <label className="font-display text-[10px] tracking-wider text-muted-foreground block mb-1">PLAYER</label>
      <select
        value={playerId} onChange={e => setPlayerId(e.target.value)}
        disabled={!!prefilledPlayerId}
        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70"
      >
        <option value="">Select player...</option>
        {players.map(p => (
          <option key={p.player_id} value={p.player_id}>{p.full_name}</option>
        ))}
      </select>
    </div>

    {/* Type toggle */}
    <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
      {(["block", "modules"] as const).map(t => (
        <button key={t} onClick={() => setAssignType(t)}
          className={`flex-1 py-2 rounded-md font-display text-[10px] tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
            assignType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t === "block" ? <><Layers size={12} /> ASSIGN BLOCK</> : <><BookOpen size={12} /> PICK MODULES</>}
        </button>
      ))}
    </div>

    {/* Search */}
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        placeholder={assignType === "block" ? "Search blocks..." : "Search modules..."}
        value={search} onChange={e => setSearch(e.target.value)}
        className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>

    {/* Category filter */}
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_FILTERS.map(cat => (
        <button key={cat} onClick={() => setCategoryFilter(cat)}
          className={`px-3 py-1.5 rounded-full font-display text-[9px] tracking-wider whitespace-nowrap transition-colors border ${
            categoryFilter === cat
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          {cat.toUpperCase()}
        </button>
      ))}
    </div>

    {/* Live builder */}
    {((assignType === "block" && selectedBlock) || (assignType === "modules" && selectedModules.length > 0)) && (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-[10px] tracking-wider text-primary">PLAN BUILDER</p>
            <p className="text-[11px] font-body text-muted-foreground">
              {assignType === "block"
                ? "1 block selected"
                : `${selectedModules.length} module${selectedModules.length === 1 ? "" : "s"} selected`} · {totalDuration}min
            </p>
          </div>
          <button
            onClick={onClearSelection}
            className="text-[10px] font-display tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            CLEAR
          </button>
        </div>

        {assignType === "block" && selectedBlock ? (
          <div className={`p-3 rounded-lg border border-l-4 border-border bg-secondary/60 ${
            CATEGORY_BORDER_COLORS[selectedBlock.category?.toLowerCase()] || "border-l-muted-foreground"
          }`}>
            <p className="font-display text-xs text-foreground">{selectedBlock.title}</p>
            <p className="text-[10px] font-body text-muted-foreground">
              {selectedBlock.category} · {selectedBlock.duration_minutes}min · {selectedBlock.module_ids?.length || 0} modules
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {selectedModules.map((module, index) => (
              <div
                key={module.id}
                className={`flex items-center gap-3 p-3 rounded-lg border border-l-4 border-border bg-secondary/60 ${
                  CATEGORY_BORDER_COLORS[module.category?.toLowerCase()] || "border-l-muted-foreground"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-display text-primary-foreground ${
                  CATEGORY_DOT_COLORS[module.category?.toLowerCase()] || "bg-muted-foreground"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs text-foreground">{module.title}</p>
                  <p className="text-[10px] font-body text-muted-foreground">
                    {module.category?.replace("_", " ")} · {module.duration_minutes || 0}min
                  </p>
                </div>
                <button
                  onClick={() => onRemoveModule(module.id)}
                  className="w-7 h-7 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* List */}
    <div className="space-y-1.5 max-h-[35vh] overflow-y-auto">
      {assignType === "block" ? (
        filteredBlocks.length === 0 ? (
          <p className="text-xs font-body text-muted-foreground text-center py-6">No blocks found</p>
        ) : (
          filteredBlocks.map(b => {
            const isSelected = selectedBlockId === b.id;
            return (
              <button key={b.id} onClick={() => setSelectedBlockId(b.id)}
                className={`w-full text-left p-3 rounded-lg border border-l-4 transition-all flex items-center gap-3 ${
                  CATEGORY_BORDER_COLORS[b.category?.toLowerCase()] || "border-l-muted-foreground"
                } ${
                  isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs text-foreground">{b.title}</p>
                  <p className="text-[10px] font-body text-muted-foreground">
                    {b.category} · {b.duration_minutes}min · {b.module_ids?.length || 0} modules
                  </p>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                  {isSelected ? <Check size={14} /> : <Plus size={14} />}
                </div>
              </button>
            );
          })
        )
      ) : (
        filteredModules.length === 0 ? (
          <p className="text-xs font-body text-muted-foreground text-center py-6">No modules found</p>
        ) : (
          filteredModules.map(m => {
            const isSelected = selectedModuleIds.includes(m.id);
            return (
              <button key={m.id} onClick={() => toggleModule(m.id)}
                className={`w-full text-left p-3 rounded-lg border border-l-4 transition-all flex items-center gap-3 ${
                  CATEGORY_BORDER_COLORS[m.category?.toLowerCase()] || "border-l-muted-foreground"
                } ${
                  isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs text-foreground">{m.title}</p>
                  <p className="text-[10px] font-body text-muted-foreground">
                    {m.category?.replace("_", " ")} · {m.duration_minutes || 0}min
                  </p>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}>
                  {isSelected ? <Check size={14} /> : <Plus size={14} />}
                </div>
              </button>
            );
          })
        )
      )}
    </div>

    {/* Selection summary */}
    {assignType === "modules" && selectedModuleIds.length > 0 && (
      <p className="text-xs font-body text-primary">{selectedModuleIds.length} modules selected</p>
    )}

    {/* Next */}
    <button
      onClick={onNext}
      disabled={!canProceed}
      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      REVIEW PLAN <ArrowRight size={16} />
    </button>
  </>
);

/* ─── Step 2: Review ─── */
interface ReviewStepProps {
  playerName: string;
  date: string;
  assignType: "block" | "modules";
  selectedBlock?: TrainingBlock;
  selectedModules: ModuleItem[];
  totalDuration: number;
  saving: boolean;
  onConfirm: () => void;
}

const ReviewStep = ({
  playerName, date, assignType, selectedBlock, selectedModules,
  totalDuration, saving, onConfirm,
}: ReviewStepProps) => {
  const formattedDate = (() => {
    try { return format(new Date(date + "T00:00:00"), "EEEE, d MMMM yyyy"); }
    catch { return date; }
  })();

  return (
    <>
      <h2 className="font-display text-lg tracking-wider text-foreground">REVIEW PLAN</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary rounded-lg p-3 text-center">
          <User size={14} className="mx-auto mb-1 text-primary" />
          <p className="font-display text-[9px] tracking-wider text-muted-foreground">PLAYER</p>
          <p className="font-body text-xs text-foreground truncate">{playerName}</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 text-center">
          <CalendarDays size={14} className="mx-auto mb-1 text-primary" />
          <p className="font-display text-[9px] tracking-wider text-muted-foreground">DATE</p>
          <p className="font-body text-xs text-foreground">{(() => { try { return format(new Date(date + "T00:00:00"), "d MMM"); } catch { return date; } })()}</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 text-center">
          <Clock size={14} className="mx-auto mb-1 text-primary" />
          <p className="font-display text-[9px] tracking-wider text-muted-foreground">DURATION</p>
          <p className="font-body text-xs text-foreground">{totalDuration}min</p>
        </div>
      </div>

      {/* Plan content */}
      <div>
        <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">
          {assignType === "block" ? "TRAINING BLOCK" : `MODULES (${selectedModules.length})`}
        </p>

        {assignType === "block" && selectedBlock ? (
          <div className={`p-4 rounded-lg border border-l-4 ${CATEGORY_BORDER_COLORS[selectedBlock.category?.toLowerCase()] || "border-l-muted-foreground"} border-border bg-secondary/50`}>
            <p className="font-display text-sm text-foreground mb-1">{selectedBlock.title}</p>
            <p className="text-[10px] font-body text-muted-foreground">
              {selectedBlock.category} · {selectedBlock.duration_minutes}min · {selectedBlock.module_ids?.length || 0} modules
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            {selectedModules.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-lg border border-l-4 border-border bg-secondary/50 ${
                  CATEGORY_BORDER_COLORS[m.category?.toLowerCase()] || "border-l-muted-foreground"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-display text-primary-foreground ${
                  CATEGORY_DOT_COLORS[m.category?.toLowerCase()] || "bg-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xs text-foreground">{m.title}</p>
                  <p className="text-[10px] font-body text-muted-foreground">
                    {m.category?.replace("_", " ")} · {m.duration_minutes || 0}min
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info callout */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-[11px] font-body text-muted-foreground leading-relaxed">
          This will create a training plan for <span className="text-foreground font-semibold">{playerName}</span> on <span className="text-foreground font-semibold">{formattedDate}</span>. The player will be notified.
        </p>
      </div>

      {/* Confirm */}
      <button
        onClick={onConfirm}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? "CREATING..." : <><Check size={16} /> CONFIRM & CREATE</>}
      </button>
    </>
  );
};

export default QuickAddTrainingDrawer;
