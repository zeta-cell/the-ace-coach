import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Search, Layers, BookOpen } from "lucide-react";
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

const QuickAddTrainingDrawer = ({
  open, onClose, prefilledDate, prefilledPlayerId, onSaved,
}: QuickAddTrainingDrawerProps) => {
  const { user } = useAuth();
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
    }
  }, [open, user]);

  useEffect(() => {
    if (prefilledDate) setDate(prefilledDate);
  }, [prefilledDate]);

  useEffect(() => {
    if (prefilledPlayerId) setPlayerId(prefilledPlayerId);
  }, [prefilledPlayerId]);

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

  const handleSave = async () => {
    if (!user || !playerId || !date) {
      toast.error("Select a player and date");
      return;
    }
    setSaving(true);

    if (assignType === "block" && selectedBlockId) {
      const block = blocks.find(b => b.id === selectedBlockId);
      if (!block) { setSaving(false); return; }

      const { data: plan } = await supabase.from("player_day_plans").insert({
        coach_id: user.id, player_id: playerId, plan_date: date,
        notes: block.title, start_time: "09:00",
      }).select("id").single();

      if (plan && block.module_ids?.length > 0) {
        for (let i = 0; i < block.module_ids.length; i++) {
          await supabase.from("player_day_plan_items").insert({
            plan_id: plan.id,
            module_id: block.module_ids[i],
            order_index: i,
            coach_note: block.module_notes?.[i] || null,
            block_id: block.id,
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
    } else {
      toast.error("Select a block or modules");
      setSaving(false);
      return;
    }

    // Notify player
    const playerName = players.find(p => p.player_id === playerId)?.full_name;
    await supabase.from("notifications").insert({
      user_id: playerId,
      title: "New training assigned",
      body: `Your coach assigned training for ${format(new Date(date + "T00:00:00"), "d MMM yyyy")}`,
      link: `/training?date=${date}`,
    });

    toast.success("Training assigned!", { duration: 1500 });
    setSaving(false);
    onSaved?.();
    onClose();
    // Reset
    setSelectedBlockId("");
    setSelectedModuleIds([]);
    setSearch("");
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg tracking-wider text-foreground">CREATE TRAINING</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

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

              {/* List */}
              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                {assignType === "block" ? (
                  filteredBlocks.length === 0 ? (
                    <p className="text-xs font-body text-muted-foreground text-center py-6">No blocks found</p>
                  ) : filteredBlocks.map(b => (
                    <button key={b.id} onClick={() => setSelectedBlockId(b.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedBlockId === b.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className="font-display text-xs text-foreground">{b.title}</p>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {b.category} · {b.duration_minutes}min · {b.module_ids?.length || 0} modules
                      </p>
                    </button>
                  ))
                ) : (
                  filteredModules.length === 0 ? (
                    <p className="text-xs font-body text-muted-foreground text-center py-6">No modules found</p>
                  ) : filteredModules.map(m => (
                    <button key={m.id} onClick={() => toggleModule(m.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedModuleIds.includes(m.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className="font-display text-xs text-foreground">{m.title}</p>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {m.category?.replace("_", " ")} · {m.duration_minutes || 0}min
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* Selection summary */}
              {assignType === "modules" && selectedModuleIds.length > 0 && (
                <p className="text-xs font-body text-primary">{selectedModuleIds.length} modules selected</p>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving || !playerId || !date || (assignType === "block" ? !selectedBlockId : selectedModuleIds.length === 0)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "SAVING..." : "CREATE TRAINING"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickAddTrainingDrawer;
