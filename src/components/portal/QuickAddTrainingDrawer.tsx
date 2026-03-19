import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Search, Layers, BookOpen, Plus, Check, ArrowLeft, ArrowRight, Clock, User, CalendarDays, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import FloatingPlanBuilder from "@/components/portal/FloatingPlanBuilder";
import type { StagedItem } from "@/components/portal/FloatingPlanBuilder";

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
  description: string | null;
  instructions: string | null;
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
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
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
      .select("id, title, category, duration_minutes, description, instructions")
      .or(`created_by.eq.${user.id},is_shared.eq.true`)
      .order("category");
    setModules((data as ModuleItem[]) || []);
  };

  const addBlockToStaged = (block: TrainingBlock) => {
    const moduleMap = new Map(modules.map(module => [module.id, module]));
    const newItems = block.module_ids.map((moduleId, index) => {
      const module = moduleMap.get(moduleId);
      if (!module) return null;
      return {
        tempId: crypto.randomUUID(),
        moduleId,
        module,
        coachNote: block.module_notes?.[index] || "",
        duration: block.module_durations?.[index] || module.duration_minutes || 15,
        sourceBlockTitle: block.title,
      } satisfies StagedItem;
    }).filter(Boolean) as StagedItem[];

    if (newItems.length === 0) {
      toast.error("Block references modules you don't have");
      return;
    }

    setStagedItems(prev => [
      ...prev.filter(item => item.sourceBlockTitle !== block.title),
      ...newItems,
    ]);
    setAssignType("block");
    toast.success(`Added \"${block.title}\" — ${newItems.length} modules`);
  };

  const removeBlockFromStaged = (blockTitle: string) => {
    setStagedItems(prev => prev.filter(item => item.sourceBlockTitle !== blockTitle));
  };

  const addModuleToStaged = (module: ModuleItem) => {
    setStagedItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      moduleId: module.id,
      module,
      coachNote: "",
      duration: module.duration_minutes || 15,
      sourceBlockTitle: "Custom",
    }]);
    setAssignType("modules");
    toast.success(`Added \"${module.title}\"`);
  };

  const toggleModule = (id: string) => {
    const hasCustomModule = stagedItems.some(item => item.moduleId === id && item.sourceBlockTitle === "Custom");

    if (hasCustomModule) {
      setStagedItems(prev => prev.filter(item => !(item.moduleId === id && item.sourceBlockTitle === "Custom")));
      return;
    }

    const module = modules.find(item => item.id === id);
    if (module) addModuleToStaged(module);
  };

  const clearSelection = () => {
    setStagedItems([]);
  };

  const playerName = players.find(p => p.player_id === playerId)?.full_name || "—";
  const totalDuration = stagedItems.reduce((sum, item) => sum + item.duration, 0);
  const canProceedToReview = Boolean(playerId && date && stagedItems.length > 0);

  const handleReview = () => {
    if (!canProceedToReview) {
      toast.error("Select a player, date, and training content");
      return;
    }
    setStep("review");
  };

  const handleSave = async () => {
    if (!user || !playerId || !date || stagedItems.length === 0) return;
    setSaving(true);

    const sourceBlocks = Array.from(new Set(stagedItems
      .map(item => item.sourceBlockTitle)
      .filter(title => title !== "Custom")));

    const planLabel = sourceBlocks.length === 1 && stagedItems.every(item => item.sourceBlockTitle === sourceBlocks[0])
      ? sourceBlocks[0]
      : `${stagedItems.length} modules`;

    const { data: plan } = await supabase.from("player_day_plans").insert({
      coach_id: user.id,
      player_id: playerId,
      plan_date: date,
      notes: planLabel,
      start_time: "09:00",
    }).select("id").single();

    if (plan) {
      const blockIdByTitle = new Map(blocks.map(block => [block.title, block.id]));
      await supabase.from("player_day_plan_items").insert(
        stagedItems.map((item, index) => ({
          plan_id: plan.id,
          module_id: item.moduleId,
          order_index: index,
          coach_note: item.coachNote || null,
          block_id: item.sourceBlockTitle !== "Custom" ? blockIdByTitle.get(item.sourceBlockTitle) || null : null,
        })),
      );
    }

    await supabase.from("notifications").insert({
      user_id: playerId,
      title: "New training assigned",
      body: `Your coach assigned training for ${format(new Date(date + "T00:00:00"), "d MMM yyyy")}`,
      link: `/training?date=${date}`,
    });

    toast.success("Training assigned!", { duration: 1500 });
    setSaving(false);
    onSaved?.();

    setStagedItems([]);
    setSearch("");
    setCategoryFilter("All");
    setAssignType("block");
    setStep("select");

    onClose();
    navigate(`/training?date=${date}&player=${playerId}`);
  };

  const matchesCategory = (cat: string) => {
    if (categoryFilter === "All") return true;
    return cat.toLowerCase().includes(categoryFilter.toLowerCase());
  };

  const filteredBlocks = blocks.filter(block =>
    block.title.toLowerCase().includes(search.toLowerCase()) && matchesCategory(block.category)
  );

  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(search.toLowerCase()) && matchesCategory(module.category)
  );

  const handleClose = () => {
    setStep("select");
    setAssignType("block");
    setSearch("");
    setCategoryFilter("All");
    setStagedItems([]);
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
            <div className="px-4 pt-3 pb-32 space-y-2.5">
              <div className="flex items-center justify-between">
                {step === "review" ? (
                  <button onClick={() => setStep("select")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={14} />
                    <span className="font-display text-[9px] tracking-wider">BACK</span>
                  </button>
                ) : (
                  <h2 className="font-display text-sm tracking-wider text-foreground">CREATE TRAINING</h2>
                )}
                <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                  <X size={16} className="text-muted-foreground" />
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
                  allModules={modules}
                  stagedItems={stagedItems}
                  toggleModule={toggleModule}
                  onAddBlock={addBlockToStaged}
                  onRemoveBlock={removeBlockFromStaged}
                  onClearSelection={clearSelection}
                  canProceed={canProceedToReview}
                  onNext={handleReview}
                />
              ) : (
                <ReviewStep
                  playerName={playerName}
                  date={date}
                  stagedItems={stagedItems}
                  totalDuration={totalDuration}
                  saving={saving}
                  onConfirm={handleSave}
                />
              )}
            </div>

            <AnimatePresence>
              {step === "select" && stagedItems.length > 0 && (
                <FloatingPlanBuilder
                  stagedItems={stagedItems}
                  setStagedItems={setStagedItems}
                  allModules={modules}
                  onApply={handleReview}
                  applying={false}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface SelectionStepProps {
  date: string; setDate: (v: string) => void;
  playerId: string; setPlayerId: (v: string) => void;
  prefilledPlayerId?: string;
  players: AssignedPlayer[];
  assignType: "block" | "modules"; setAssignType: (v: "block" | "modules") => void;
  search: string; setSearch: (v: string) => void;
  categoryFilter: string; setCategoryFilter: (v: string) => void;
  filteredBlocks: TrainingBlock[]; filteredModules: ModuleItem[];
  allModules: ModuleItem[];
  stagedItems: StagedItem[];
  toggleModule: (id: string) => void;
  onAddBlock: (block: TrainingBlock) => void;
  onRemoveBlock: (blockTitle: string) => void;
  onClearSelection: () => void;
  canProceed: boolean;
  onNext: () => void;
}

const SelectionStep = ({
  date, setDate, playerId, setPlayerId, prefilledPlayerId, players,
  assignType, setAssignType, search, setSearch, categoryFilter, setCategoryFilter,
  filteredBlocks, filteredModules, allModules, stagedItems, toggleModule,
  onAddBlock, onRemoveBlock, onClearSelection, canProceed, onNext,
}: SelectionStepProps) => {
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  return (
    <>
      {/* Date + Player in one row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex-1">
          <select
            value={playerId} onChange={e => setPlayerId(e.target.value)}
            disabled={!!prefilledPlayerId}
            className="w-full px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70"
          >
            <option value="">Player...</option>
            {players.map(player => (
              <option key={player.player_id} value={player.player_id}>{player.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
        {(["block", "modules"] as const).map(type => (
          <button key={type} onClick={() => setAssignType(type)}
            className={`flex-1 py-1.5 rounded-md font-display text-[9px] tracking-wider transition-colors flex items-center justify-center gap-1 ${
              assignType === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {type === "block" ? <><Layers size={10} /> BLOCKS</> : <><BookOpen size={10} /> MODULES</>}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder={assignType === "block" ? "Search blocks..." : "Search modules..."}
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {CATEGORY_FILTERS.map(category => (
          <button key={category} onClick={() => setCategoryFilter(category)}
            className={`px-2 py-1 rounded-full font-display text-[8px] tracking-wider whitespace-nowrap transition-colors border ${
              categoryFilter === category
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>

      <div className={`space-y-1.5 max-h-[35vh] overflow-y-auto ${stagedItems.length > 0 ? "pb-28" : ""}`}>
        {assignType === "block" ? (
          filteredBlocks.length === 0 ? (
            <p className="text-xs font-body text-muted-foreground text-center py-6">No blocks found</p>
          ) : (
            filteredBlocks.map(block => {
              const isSelected = stagedItems.some(item => item.sourceBlockTitle === block.title);
              const isExpanded = expandedBlockId === block.id;
              return (
                <div key={block.id}
                  className={`rounded-lg border border-l-4 transition-all overflow-hidden ${
                    CATEGORY_BORDER_COLORS[block.category?.toLowerCase()] || "border-l-muted-foreground"
                  } ${
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xs text-foreground">{block.title}</p>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {block.category} · {block.duration_minutes}min · {block.module_ids?.length || 0} modules
                      </p>
                    </div>
                    <button onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <button onClick={() => isSelected ? onRemoveBlock(block.title) : onAddBlock(block)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}>
                      {isSelected ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="px-3 pb-3 pt-1 border-t border-border space-y-1.5">
                          <div className="flex flex-wrap gap-1.5 text-[9px] font-body text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Clock size={9} /> {block.duration_minutes} min</span>
                            <span>·</span>
                            <span>{block.module_ids?.length || 0} modules</span>
                          </div>
                          {block.module_ids && block.module_ids.length > 0 && (
                            <div className="space-y-1">
                              {block.module_ids.map((moduleId, index) => {
                                const module = allModules.find(item => item.id === moduleId);
                                const duration = block.module_durations?.[index];
                                return (
                                  <div key={`${moduleId}-${index}`} className={`flex items-center gap-2 py-1.5 px-2 rounded-md bg-secondary/80 border-l-2 ${
                                    CATEGORY_BORDER_COLORS[module?.category?.toLowerCase() || ""] || "border-l-muted-foreground"
                                  }`}>
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-display text-primary-foreground ${
                                      CATEGORY_DOT_COLORS[module?.category?.toLowerCase() || ""] || "bg-muted-foreground"
                                    }`}>{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-display text-[10px] text-foreground truncate">{module?.title || "Unknown module"}</p>
                                      <p className="text-[9px] font-body text-muted-foreground">
                                        {module?.category?.replace("_", " ") || "—"} · {duration || module?.duration_minutes || 0}min
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )
        ) : (
          filteredModules.length === 0 ? (
            <p className="text-xs font-body text-muted-foreground text-center py-6">No modules found</p>
          ) : (
            filteredModules.map(module => {
              const isSelected = stagedItems.some(item => item.moduleId === module.id && item.sourceBlockTitle === "Custom");
              const isExpanded = expandedModuleId === module.id;
              const hasDetails = module.description || module.instructions;
              return (
                <div key={module.id}
                  className={`rounded-lg border border-l-4 transition-all overflow-hidden ${
                    CATEGORY_BORDER_COLORS[module.category?.toLowerCase()] || "border-l-muted-foreground"
                  } ${
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-xs text-foreground">{module.title}</p>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {module.category?.replace("_", " ")} · {module.duration_minutes || 0}min
                      </p>
                    </div>
                    {hasDetails && (
                      <button onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                    <button onClick={() => toggleModule(module.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}>
                      {isSelected ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {isExpanded && hasDetails && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="px-3 pb-3 pt-1 border-t border-border space-y-1.5">
                          {module.description && (
                            <p className="text-[10px] font-body text-muted-foreground">{module.description}</p>
                          )}
                          {module.instructions && (
                            <div>
                              <span className="text-[9px] font-display text-foreground/70 uppercase tracking-wider">Instructions</span>
                              <p className="text-[10px] font-body text-muted-foreground mt-0.5 whitespace-pre-line">{module.instructions}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )
        )}
      </div>

      {stagedItems.length > 0 && (
        <button
          onClick={onClearSelection}
          className="w-full py-2 rounded-xl border border-border text-muted-foreground font-display text-[10px] tracking-wider hover:text-foreground hover:border-primary transition-colors"
        >
          CLEAR STAGED PLAN
        </button>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        REVIEW PLAN <ArrowRight size={16} />
      </button>
    </>
  );
};

interface ReviewStepProps {
  playerName: string;
  date: string;
  stagedItems: StagedItem[];
  totalDuration: number;
  saving: boolean;
  onConfirm: () => void;
}

const ReviewStep = ({
  playerName, date, stagedItems,
  totalDuration, saving, onConfirm,
}: ReviewStepProps) => {
  const formattedDate = (() => {
    try { return format(new Date(date + "T00:00:00"), "EEEE, d MMMM yyyy"); }
    catch { return date; }
  })();

  return (
    <>
      <h2 className="font-display text-lg tracking-wider text-foreground">REVIEW PLAN</h2>

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

      <div>
        <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">
          MODULES ({stagedItems.length})
        </p>

        <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
          {stagedItems.map((item, index) => (
            <div
              key={item.tempId}
              className={`flex items-center gap-3 p-3 rounded-lg border border-l-4 border-border bg-secondary/50 ${
                CATEGORY_BORDER_COLORS[item.module.category?.toLowerCase()] || "border-l-muted-foreground"
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-display text-primary-foreground ${
                CATEGORY_DOT_COLORS[item.module.category?.toLowerCase()] || "bg-muted-foreground"
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-xs text-foreground">{item.module.title}</p>
                <p className="text-[10px] font-body text-muted-foreground">
                  {item.module.category?.replace("_", " ")} · {item.duration}min{item.sourceBlockTitle !== "Custom" ? ` · ${item.sourceBlockTitle}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-[11px] font-body text-muted-foreground leading-relaxed">
          This will create a training plan for <span className="text-foreground font-semibold">{playerName}</span> on <span className="text-foreground font-semibold">{formattedDate}</span>. The player will be notified.
        </p>
      </div>

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
