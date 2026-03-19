import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp, ChevronDown, Plus, Minus, Trash2, Search, Clock,
  ChevronRight, X, Layers,
} from "lucide-react";
import type { ModuleItem } from "@/types/training";

const CATEGORY_DOT: Record<string, string> = {
  warm_up: "bg-yellow-500", padel_drill: "bg-cyan-500", padel: "bg-cyan-500",
  footwork: "bg-blue-500", fitness: "bg-orange-500", strength: "bg-orange-600",
  mental: "bg-purple-500", recovery: "bg-green-500", cool_down: "bg-teal-500",
  nutrition: "bg-lime-500", video: "bg-pink-500", tennis: "bg-emerald-500",
  tactical: "bg-amber-500", technique: "bg-primary",
};

export interface StagedItem {
  tempId: string;
  moduleId: string;
  module: ModuleItem;
  coachNote: string;
  duration: number;
  sourceBlockTitle: string;
}

interface FloatingPlanBuilderProps {
  stagedItems: StagedItem[];
  setStagedItems: React.Dispatch<React.SetStateAction<StagedItem[]>>;
  allModules: ModuleItem[];
  onApply: () => void;
  applying?: boolean;
}

const FloatingPlanBuilder = ({
  stagedItems, setStagedItems, allModules, onApply, applying,
}: FloatingPlanBuilderProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  if (stagedItems.length === 0) return null;

  const totalDur = stagedItems.reduce((s, i) => s + i.duration, 0);

  const moveStagedItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stagedItems.length) return;
    const updated = [...stagedItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setStagedItems(updated);
  };

  const removeStagedItem = (tempId: string) => {
    setStagedItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const addModuleToStaged = (mod: ModuleItem) => {
    setStagedItems(prev => [...prev, {
      tempId: crypto.randomUUID(),
      moduleId: mod.id,
      module: mod,
      coachNote: "",
      duration: mod.duration_minutes || 15,
      sourceBlockTitle: "Custom",
    }]);
    setShowAddModule(false);
    setSearchVal("");
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      <div className="max-w-3xl mx-auto px-2 pb-2">
        <div className="bg-card border border-primary/40 rounded-xl shadow-lg shadow-primary/10 overflow-hidden">
          {/* Header — always visible */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-primary" />
              <span className="font-display text-xs text-primary tracking-wider">PLAN BUILDER</span>
              <span className="font-body text-[10px] text-muted-foreground">
                {stagedItems.length} module{stagedItems.length !== 1 ? "s" : ""} · {totalDur}min
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setStagedItems([]); }}
                className="font-display text-[9px] tracking-wider text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5"
              >
                CLEAR
              </button>
              {collapsed ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </div>
          </button>

          {/* Expanded content */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-2 max-h-[40vh] overflow-y-auto scrollbar-none">
                  {/* Module list */}
                  {stagedItems.map((item, idx) => (
                    <div key={item.tempId} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary/60 border border-border group">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-display text-primary-foreground ${CATEGORY_DOT[item.module.category?.toLowerCase() || ""] || "bg-muted"}`}>
                        {idx + 1}
                      </div>
                      <div className="flex flex-col gap-0">
                        <button onClick={() => moveStagedItem(idx, "up")} disabled={idx === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors p-0.5">
                          <ChevronUp size={10} />
                        </button>
                        <button onClick={() => moveStagedItem(idx, "down")} disabled={idx === stagedItems.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors p-0.5">
                          <ChevronDown size={10} />
                        </button>
                      </div>
                      <div className={`w-1 h-6 rounded-full ${CATEGORY_DOT[item.module.category?.toLowerCase() || ""] || "bg-muted"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-display text-foreground truncate">{item.module.title}</p>
                        <p className="text-[9px] font-body text-muted-foreground">
                          {item.module.category?.replace("_", " ")} · {item.sourceBlockTitle !== "Custom" ? <span className="text-primary/60">{item.sourceBlockTitle}</span> : "Custom"}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setStagedItems(prev => prev.map(i => i.tempId === item.tempId ? { ...i, duration: Math.max(5, i.duration - 5) } : i))}
                          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"><Minus size={10} /></button>
                        <span className="text-[9px] font-body text-muted-foreground w-7 text-center tabular-nums">{item.duration}m</span>
                        <button onClick={() => setStagedItems(prev => prev.map(i => i.tempId === item.tempId ? { ...i, duration: i.duration + 5 } : i))}
                          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"><Plus size={10} /></button>
                      </div>
                      <button onClick={() => removeStagedItem(item.tempId)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}

                  {/* Inline add module */}
                  <button onClick={() => setShowAddModule(!showAddModule)}
                    className="w-full py-1.5 rounded-lg border border-dashed border-border text-muted-foreground font-display text-[9px] tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                    <Plus size={11} /> ADD MODULE
                  </button>

                  <AnimatePresence>
                    {showAddModule && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="space-y-1.5 pt-1">
                          <div className="relative">
                            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input value={searchVal} onChange={e => setSearchVal(e.target.value)}
                              placeholder="Search modules..."
                              className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground font-body text-[10px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-0.5 scrollbar-none">
                            {allModules.filter(m => !searchVal || m.title.toLowerCase().includes(searchVal.toLowerCase())).slice(0, 15).map(mod => (
                              <button key={mod.id} onClick={() => addModuleToStaged(mod)}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2">
                                <div className={`w-1 h-4 rounded-full ${CATEGORY_DOT[mod.category?.toLowerCase() || ""] || "bg-muted"}`} />
                                <span className="text-[10px] font-body text-foreground flex-1 truncate">{mod.title}</span>
                                <span className="text-[9px] font-body text-muted-foreground">{mod.duration_minutes || 15}m</span>
                                <Plus size={10} className="text-primary shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Apply button */}
                <div className="px-4 pb-3">
                  <button onClick={onApply} disabled={applying}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                    APPLY TO PLAN <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingPlanBuilder;
