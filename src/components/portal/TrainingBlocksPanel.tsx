import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Plus, Search, ChevronDown, ChevronRight, Copy, Save, X, Target } from "lucide-react";

/* ── types ── */
interface TrainingBlock {
  id: string;
  title: string;
  description: string | null;
  goal: string;
  category: string;
  module_ids: string[];
  module_durations: number[];
  module_notes: string[];
  is_system: boolean;
  coach_id: string | null;
}

interface ModuleItem {
  id: string;
  title: string;
  category: string;
  duration_minutes: number | null;
}

interface PlanItem {
  tempId: string;
  module: ModuleItem;
  coach_note: string;
  custom_duration: number;
}

const GOAL_ICONS: Record<string, string> = {
  "Match Preparation": "🎯",
  "Technique": "🎾",
  "Fitness": "💪",
  "Recovery": "🧘",
  "Warm Up": "🔥",
  "Footwork": "👟",
  "Mental": "🧠",
  "Kids": "⭐",
  "Beginner": "📘",
  "Advanced": "🏆",
};

const GOAL_COLORS: Record<string, string> = {
  "Match Preparation": "border-amber-500/30 bg-amber-500/5",
  "Technique": "border-cyan-500/30 bg-cyan-500/5",
  "Fitness": "border-orange-500/30 bg-orange-500/5",
  "Recovery": "border-green-500/30 bg-green-500/5",
  "Warm Up": "border-red-500/30 bg-red-500/5",
  "Footwork": "border-blue-500/30 bg-blue-500/5",
  "Mental": "border-purple-500/30 bg-purple-500/5",
  "Kids": "border-yellow-500/30 bg-yellow-500/5",
  "Beginner": "border-sky-500/30 bg-sky-500/5",
  "Advanced": "border-rose-500/30 bg-rose-500/5",
};

interface TrainingBlocksPanelProps {
  onApplyBlock: (items: PlanItem[]) => void;
  onSaveAsBlock: () => void;
  modules: ModuleItem[];
}

const TrainingBlocksPanel = ({ onApplyBlock, onSaveAsBlock, modules }: TrainingBlocksPanelProps) => {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBlocks();
  }, [user]);

  const fetchBlocks = async () => {
    setLoading(true);
    let query = supabase.from("training_blocks").select("*");

    if (user) {
      query = query.or(`is_system.eq.true,coach_id.eq.${user.id}`);
    } else {
      query = query.eq("is_system", true);
    }

    const { data } = await query.order("goal").order("title");
    setBlocks((data as TrainingBlock[]) || []);
    setLoading(false);
  };

  const moduleMap = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);

  const goals = useMemo(() => {
    const goalMap = new Map<string, TrainingBlock[]>();
    const filtered = searchQuery
      ? blocks.filter((b) =>
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.goal.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : blocks;

    filtered.forEach((b) => {
      const list = goalMap.get(b.goal) || [];
      list.push(b);
      goalMap.set(b.goal, list);
    });
    return goalMap;
  }, [blocks, searchQuery]);

  const handleApply = (block: TrainingBlock) => {
    const items: PlanItem[] = block.module_ids.map((moduleId, idx) => {
      const mod = moduleMap.get(moduleId);
      if (!mod) return null;
      return {
        tempId: crypto.randomUUID(),
        module: mod,
        coach_note: block.module_notes[idx] || "",
        custom_duration: block.module_durations[idx] || mod.duration_minutes || 0,
      };
    }).filter(Boolean) as PlanItem[];

    if (items.length === 0) {
      toast.error("This block references modules you don't have yet. Create the modules first.");
      return;
    }

    onApplyBlock(items);
    toast.success(`Applied "${block.title}" — ${items.length} modules added`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <h3 className="font-display text-xs tracking-wider text-foreground">TRAINING BLOCKS</h3>
        </div>
      </div>

      {/* Save current as block */}
      <button
        onClick={onSaveAsBlock}
        className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground font-display text-[10px] tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
      >
        <Save size={12} /> SAVE CURRENT PLAN AS BLOCK
      </button>

      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search blocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
        />
      </div>

      {/* Block list by goal */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1 max-h-[calc(100vh-380px)] overflow-y-auto pr-1 scrollbar-none">
          {Array.from(goals.entries()).map(([goal, goalBlocks]) => (
            <div key={goal}>
              <button
                onClick={() => setExpandedGoal(expandedGoal === goal ? null : goal)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <span className="text-sm">{GOAL_ICONS[goal] || "📋"}</span>
                <span className="font-display text-[10px] tracking-wider text-foreground flex-1 text-left">{goal.toUpperCase()}</span>
                <span className="text-[10px] font-body text-muted-foreground mr-1">{goalBlocks.length}</span>
                {expandedGoal === goal ? (
                  <ChevronDown size={12} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={12} className="text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {expandedGoal === goal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-2 space-y-1 pb-1">
                      {goalBlocks.map((block) => {
                        const resolvedCount = block.module_ids.filter((id) => moduleMap.has(id)).length;
                        const totalDuration = block.module_durations.reduce((s, d) => s + d, 0);
                        return (
                          <div
                            key={block.id}
                            className={`p-2.5 rounded-lg border transition-colors cursor-pointer hover:border-primary/40 ${
                              GOAL_COLORS[goal] || "border-border bg-card"
                            }`}
                            onClick={() => handleApply(block)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-display text-xs text-foreground truncate flex-1">{block.title}</p>
                              <Plus size={12} className="text-primary shrink-0 ml-1" />
                            </div>
                            {block.description && (
                              <p className="text-[10px] font-body text-muted-foreground line-clamp-1 mb-1">{block.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-[9px] font-body text-muted-foreground">
                              <span>{resolvedCount}/{block.module_ids.length} modules</span>
                              <span>·</span>
                              <span>{totalDuration} min</span>
                              {block.is_system && <span className="text-primary/60">SYSTEM</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {goals.size === 0 && (
            <div className="text-center py-6">
              <p className="text-xs font-body text-muted-foreground">No blocks found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrainingBlocksPanel;
export type { TrainingBlock, PlanItem as BlockPlanItem, ModuleItem as BlockModuleItem };
