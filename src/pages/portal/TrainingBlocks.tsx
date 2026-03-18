import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Blocks, ChevronDown, ChevronRight, Clock, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";

interface TrainingBlock {
  id: string;
  title: string;
  description: string | null;
  category: string;
  goal: string;
  difficulty: string;
  sport: string;
  duration_minutes: number;
  module_ids: string[];
  module_durations: number[];
  module_notes: string[];
  is_system: boolean | null;
  is_public: boolean | null;
  coach_id: string | null;
}

interface ModuleOption {
  id: string;
  title: string;
  category: string;
  duration_minutes: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  beginner: "Beginner", power: "Power", defense: "Defense", net_play: "Net Play",
  match_prep: "Match Prep", speed: "Speed", technique: "Technique", competition: "Competition",
  endurance: "Endurance", strength: "Strength", recovery: "Recovery", mental: "Mental",
  analysis: "Analysis", express: "Express", general: "General",
};

const BLOCK_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  beginner:    { bg: "bg-green-500/10",  text: "text-green-500",  border: "border-green-500/30" },
  power:       { bg: "bg-red-500/10",    text: "text-red-500",    border: "border-red-500/30" },
  defense:     { bg: "bg-blue-500/10",   text: "text-blue-500",   border: "border-blue-500/30" },
  net_play:    { bg: "bg-cyan-500/10",   text: "text-cyan-500",   border: "border-cyan-500/30" },
  match_prep:  { bg: "bg-amber-500/10",  text: "text-amber-500",  border: "border-amber-500/30" },
  speed:       { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/30" },
  technique:   { bg: "bg-teal-500/10",   text: "text-teal-500",   border: "border-teal-500/30" },
  competition: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
  endurance:   { bg: "bg-rose-500/10",   text: "text-rose-500",   border: "border-rose-500/30" },
  strength:    { bg: "bg-orange-600/10", text: "text-orange-600", border: "border-orange-600/30" },
  recovery:    { bg: "bg-emerald-500/10",text: "text-emerald-500",border: "border-emerald-500/30" },
  mental:      { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
  analysis:    { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/30" },
  express:     { bg: "bg-pink-500/10",   text: "text-pink-500",   border: "border-pink-500/30" },
  general:     { bg: "bg-muted/50",      text: "text-muted-foreground", border: "border-border" },
};

const BLOCK_ACCENT_COLORS: Record<string, string> = {
  beginner: "bg-green-500", power: "bg-red-500", defense: "bg-blue-500",
  net_play: "bg-cyan-500", match_prep: "bg-amber-500", speed: "bg-yellow-500",
  technique: "bg-teal-500", competition: "bg-orange-500", endurance: "bg-rose-500",
  strength: "bg-orange-600", recovery: "bg-emerald-500", mental: "bg-purple-500",
  analysis: "bg-indigo-500", express: "bg-pink-500", general: "bg-muted",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-green-500", intermediate: "text-yellow-500",
  advanced: "text-orange-500", elite: "text-red-500",
};

const MODULE_CATEGORY_COLORS: Record<string, string> = {
  warm_up: "bg-yellow-500", padel_drill: "bg-cyan-500", footwork: "bg-blue-500",
  fitness: "bg-orange-500", strength: "bg-orange-600", mental: "bg-purple-500",
  recovery: "bg-green-500", cool_down: "bg-teal-500", nutrition: "bg-lime-500",
  video: "bg-pink-500", tennis_drill: "bg-emerald-500",
};

const TrainingBlocksPage = () => {
  const { user, role } = useAuth();
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [search, setSearch] = useState("");
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");

  // Module lookup for expanded view
  const [allModules, setAllModules] = useState<ModuleOption[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  // Create block state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("intermediate");
  const [newCategory, setNewCategory] = useState("general");
  const [newSport, setNewSport] = useState("both");
  const [selectedModules, setSelectedModules] = useState<ModuleOption[]>([]);
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchBlocks(); }, [user]);

  const fetchBlocks = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("training_blocks").select("*")
      .or(role === "admin" ? "id.not.is.null" : `is_system.eq.true,coach_id.eq.${user.id},is_public.eq.true`)
      .order("category").order("title");
    setBlocks((data as TrainingBlock[]) || []);
    setLoading(false);
  };

  const fetchModules = async () => {
    if (modulesLoaded) return;
    const { data } = await supabase.from("modules")
      .select("id, title, category, duration_minutes")
      .order("category").order("title");
    setAllModules((data as ModuleOption[]) || []);
    setModulesLoaded(true);
  };

  const moduleMap = useMemo(() => new Map(allModules.map(m => [m.id, m])), [allModules]);

  const toggleExpand = (blockId: string) => {
    if (expandedBlock === blockId) {
      setExpandedBlock(null);
    } else {
      setExpandedBlock(blockId);
      fetchModules(); // lazy load modules on first expand
    }
  };

  const openCreate = () => {
    setShowCreate(true);
    fetchModules();
    setNewTitle(""); setNewGoal(""); setNewDescription("");
    setNewDifficulty("intermediate"); setNewCategory("general"); setNewSport("both");
    setSelectedModules([]); setModuleSearch(""); setModuleFilter("all");
  };

  const createBlock = async () => {
    if (!user || !newTitle.trim() || selectedModules.length === 0) {
      toast.error("Please add a title and at least one module");
      return;
    }
    setCreating(true);
    const totalDur = selectedModules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0);

    const profileRes = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single();
    const { error } = await supabase.from("training_blocks").insert({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      category: newCategory,
      goal: newGoal.trim() || "Custom",
      difficulty: newDifficulty,
      sport: newSport,
      duration_minutes: totalDur,
      coach_id: user.id,
      author_id: user.id,
      author_name: profileRes.data?.full_name || "",
      author_avatar_url: profileRes.data?.avatar_url || null,
      is_system: false,
      is_custom: true,
      is_public: false,
      module_ids: selectedModules.map(m => m.id),
      module_durations: selectedModules.map(m => m.duration_minutes || 0),
      module_notes: selectedModules.map(() => ""),
    });

    if (error) { toast.error("Failed to create block"); setCreating(false); return; }
    toast.success(`Created "${newTitle}"`);
    setShowCreate(false);
    setCreating(false);
    fetchBlocks();
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm("Delete this training block?")) return;
    const { error } = await supabase.from("training_blocks").delete().eq("id", blockId);
    if (!error) {
      setBlocks(prev => prev.filter(b => b.id !== blockId));
      toast.success("Block deleted");
    } else {
      toast.error("Failed to delete block");
    }
  };

  const addModule = (mod: ModuleOption) => {
    if (selectedModules.find(m => m.id === mod.id)) return;
    setSelectedModules(prev => [...prev, mod]);
  };
  const removeModule = (modId: string) => setSelectedModules(prev => prev.filter(m => m.id !== modId));
  const moveModule = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= selectedModules.length) return;
    const arr = [...selectedModules];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSelectedModules(arr);
  };

  const filteredCreateModules = allModules.filter(m => {
    const matchSearch = !moduleSearch || m.title.toLowerCase().includes(moduleSearch.toLowerCase());
    const matchCat = moduleFilter === "all" || m.category === moduleFilter;
    return matchSearch && matchCat;
  });

  const moduleCats = ["all", ...new Set(allModules.map(m => m.category))];

  // Categories from blocks for filter chips
  const categories = useMemo(() => {
    const cats = new Set(blocks.map(b => b.category?.toLowerCase()));
    return ["all", ...Array.from(cats).sort()];
  }, [blocks]);

  const filtered = blocks.filter(b => {
    const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.goal?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === "all" || b.category?.toLowerCase() === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-foreground">TRAINING BLOCKS</h1>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors">
            <Plus size={16} /> NEW BLOCK
          </button>
        </div>

        {/* Create Block Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-10 px-4 overflow-y-auto"
              onClick={() => setShowCreate(false)}>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
                onClick={e => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl w-full max-w-3xl mb-10 overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-display text-xl text-foreground">CREATE TRAINING BLOCK</h2>
                  <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1 block">TITLE *</label>
                      <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Morning Power Session"
                        className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
                    </div>
                    <div>
                      <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1 block">GOAL</label>
                      <input value={newGoal} onChange={e => setNewGoal(e.target.value)} placeholder="e.g. Improve serve power"
                        className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
                    </div>
                    <div>
                      <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1 block">CATEGORY</label>
                      <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1 block">DIFFICULTY</label>
                      <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="elite">Elite</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-1 block">DESCRIPTION</label>
                    <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Brief description of the block..." rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none" />
                  </div>

                  {/* Selected modules */}
                  <div>
                    <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-2 block">
                      SELECTED MODULES ({selectedModules.length}) · {selectedModules.reduce((s, m) => s + (m.duration_minutes || 0), 0)} min total
                    </label>
                    {selectedModules.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-body py-3 text-center bg-secondary/50 rounded-lg">Add modules from the list below</p>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {selectedModules.map((mod, idx) => (
                          <div key={mod.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
                            <div className={`w-1 h-5 rounded-full ${MODULE_CATEGORY_COLORS[mod.category] || "bg-muted"}`} />
                            <span className="text-xs font-body text-muted-foreground w-5">{idx + 1}.</span>
                            <span className="text-xs font-body text-foreground flex-1 truncate">{mod.title}</span>
                            <span className="text-[10px] font-body text-muted-foreground">{mod.duration_minutes}m</span>
                            <div className="flex gap-0.5">
                              <button onClick={() => moveModule(idx, -1)} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ChevronDown size={12} className="rotate-180" />
                              </button>
                              <button onClick={() => moveModule(idx, 1)} disabled={idx === selectedModules.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                                <ChevronDown size={12} />
                              </button>
                            </div>
                            <button onClick={() => removeModule(mod.id)} className="p-0.5 text-destructive hover:bg-destructive/10 rounded">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Module picker */}
                  <div className="border border-border rounded-xl p-3">
                    <label className="text-[10px] font-display tracking-wider text-muted-foreground mb-2 block">ADD MODULES</label>
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={moduleSearch} onChange={e => setModuleSearch(e.target.value)} placeholder="Search modules..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-secondary text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
                      </div>
                      <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-secondary text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                        {moduleCats.map(c => (
                          <option key={c} value={c}>{c === "all" ? "All categories" : c.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredCreateModules.map(mod => {
                        const alreadyAdded = selectedModules.some(m => m.id === mod.id);
                        return (
                          <button key={mod.id} onClick={() => addModule(mod)} disabled={alreadyAdded}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${alreadyAdded ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary"}`}>
                            <div className={`w-1 h-5 rounded-full ${MODULE_CATEGORY_COLORS[mod.category] || "bg-muted"}`} />
                            <span className="text-xs font-body text-foreground flex-1 truncate">{mod.title}</span>
                            <span className="text-[10px] font-body text-muted-foreground">{mod.duration_minutes}m</span>
                            {!alreadyAdded && <Plus size={12} className="text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-border flex items-center justify-end gap-3">
                  <button onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-lg bg-secondary text-foreground font-display text-xs tracking-wider hover:bg-secondary/80 transition-colors">CANCEL</button>
                  <button onClick={createBlock} disabled={creating || !newTitle.trim() || selectedModules.length === 0}
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {creating ? "CREATING..." : "CREATE BLOCK"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-display text-xs tracking-wider transition-colors ${
                filterCategory === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}>
              {cat === "all" ? "ALL" : (CATEGORY_LABELS[cat] || cat.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search blocks by name or goal..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Blocks size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-display text-xl text-muted-foreground">NO BLOCKS FOUND</p>
            <p className="font-body text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(block => {
              const catColors = BLOCK_CATEGORY_COLORS[block.category] || BLOCK_CATEGORY_COLORS.general;
              return (
                <motion.div key={block.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-card border rounded-xl overflow-hidden hover:border-opacity-60 transition-colors ${catColors.border}`}>
                  <div className="flex">
                    <div className={`w-1 ${BLOCK_ACCENT_COLORS[block.category] || "bg-muted"}`} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${catColors.bg} ${catColors.text}`}>
                              {CATEGORY_LABELS[block.category] || block.category}
                            </span>
                            {block.is_system && (
                              <span className="text-[10px] font-body text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">SYSTEM</span>
                            )}
                          </div>
                          <h3 className="font-display text-lg text-foreground">{block.title}</h3>
                          {block.goal && (
                            <p className="font-body text-xs text-muted-foreground mt-0.5">{block.goal}</p>
                          )}
                        </div>
                        {!block.is_system && block.coach_id === user?.id && (
                          <button onClick={() => deleteBlock(block.id)}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-muted-foreground text-xs font-body">
                          <Clock size={12} /> {block.duration_minutes} min
                        </span>
                        {block.difficulty && (
                          <span className={`text-xs font-display tracking-wider uppercase ${DIFFICULTY_COLORS[block.difficulty] || "text-muted-foreground"}`}>
                            {block.difficulty}
                          </span>
                        )}
                      </div>

                      {block.description && (
                        <p className="font-body text-xs text-muted-foreground mt-2 line-clamp-2">{block.description}</p>
                      )}

                      <button onClick={() => toggleExpand(block.id)}
                        className="flex items-center gap-1 mt-3 text-xs font-display tracking-wider text-primary hover:text-primary/80 transition-colors">
                        {expandedBlock === block.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {expandedBlock === block.id ? "HIDE MODULES" : "VIEW MODULES"}
                      </button>
                    </div>

                    {/* Expanded module list */}
                    <AnimatePresence>
                      {expandedBlock === block.id && (
                        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                          className="overflow-hidden border-l border-border">
                          <div className="p-3 space-y-1.5 min-w-[180px]">
                            {block.module_ids.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-2">No modules</p>
                            ) : !modulesLoaded ? (
                              <div className="flex justify-center py-3">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (
                              block.module_ids.map((mId, idx) => {
                                const mod = moduleMap.get(mId);
                                const dur = block.module_durations?.[idx] || mod?.duration_minutes || 0;
                                return (
                                  <div key={`${mId}-${idx}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/50">
                                    <div className={`w-1 h-6 rounded-full ${MODULE_CATEGORY_COLORS[mod?.category || ""] || "bg-muted"}`} />
                                    <span className="text-xs font-body text-muted-foreground w-5">{idx + 1}.</span>
                                    <span className="text-xs font-body text-foreground flex-1 truncate">{mod?.title || "Unknown"}</span>
                                    <span className="text-[10px] font-body text-muted-foreground">{dur}m</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default TrainingBlocksPage;
