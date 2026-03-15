import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["warm_up", "padel_drill", "footwork", "fitness", "strength", "mental", "recovery", "nutrition", "video"];
const SPORTS = ["tennis", "padel", "both"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced", "elite"];

interface Exercise {
  name: string;
  sets: number;
  reps?: number;
  duration_sec?: number;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateTrainingBlockDrawer = ({ open, onClose, onCreated }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("padel_drill");
  const [sport, setSport] = useState("both");
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState("intermediate");
  const [goalInput, setGoalInput] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: 3, reps: 10, notes: "" }]);
  const [saving, setSaving] = useState(false);
  const [blockType, setBlockType] = useState("session");
  const [weekCount, setWeekCount] = useState(1);
  const [targetLevel, setTargetLevel] = useState("intermediate");
  const [visibility, setVisibility] = useState<"private" | "public" | "for_sale">("private");
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const addGoal = () => {
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput("");
    }
  };

  const removeGoal = (g: string) => setGoals(goals.filter((x) => x !== g));

  const updateExercise = (idx: number, field: keyof Exercise, value: any) => {
    setExercises((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const addExercise = () => setExercises([...exercises, { name: "", sets: 3, reps: 10, notes: "" }]);
  const removeExercise = (idx: number) => setExercises(exercises.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);

    const profileRes = await supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single();
    const { error } = await supabase.from("training_blocks").insert({
      coach_id: user.id,
      author_id: user.id,
      author_name: profileRes.data?.full_name || "",
      author_avatar_url: profileRes.data?.avatar_url || null,
      title: title.trim(),
      description: description.trim() || null,
      category, sport,
      duration_minutes: duration, difficulty,
      goals,
      exercises: exercises.filter((e) => e.name.trim()) as any,
      is_system: false, is_custom: true,
      is_public: visibility !== "private",
      is_for_sale: visibility === "for_sale",
      price: visibility === "for_sale" ? price : 0,
      currency,
      block_type: blockType,
      week_count: blockType === "program" ? weekCount : 1,
      target_level: targetLevel,
      target_sport: sport,
      goal: category.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      module_ids: [], module_durations: [], module_notes: [],
    } as any);

    if (error) {
      toast.error("Failed to create block");
    } else {
      toast.success(visibility === "for_sale" ? "Program published to Marketplace!" : visibility === "public" ? "Block published!" : "Block created!");
      onCreated(); onClose();
      // Reset
      setTitle(""); setDescription(""); setGoals([]); setExercises([{ name: "", sets: 3, reps: 10, notes: "" }]);
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 z-50" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm tracking-wider text-foreground">CREATE CUSTOM BLOCK</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X size={18} /></button>
              </div>

              {/* Title */}
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground">TITLE *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* Description */}
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground">DESCRIPTION</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>

              {/* Category */}
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-2 block">CATEGORY</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`px-2.5 py-1 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
                        category === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >{c.replace("_", " ").toUpperCase()}</button>
                  ))}
                </div>
              </div>

              {/* Sport */}
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-2 block">SPORT</label>
                <div className="flex gap-1.5">
                  {SPORTS.map((s) => (
                    <button key={s} onClick={() => setSport(s)}
                      className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
                        sport === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >{s.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              {/* Duration + Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">DURATION (MIN)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={5}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-2 block">DIFFICULTY</label>
                  <div className="flex flex-wrap gap-1">
                    {DIFFICULTIES.map((d) => (
                      <button key={d} onClick={() => setDifficulty(d)}
                        className={`px-2 py-1 rounded-lg font-display text-[9px] tracking-wider transition-colors ${
                          difficulty === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >{d.slice(0, 3).toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground">GOALS</label>
                <div className="flex gap-2 mt-1">
                  <input value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                    placeholder="Add a goal..."
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={addGoal} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px]">ADD</button>
                </div>
                {goals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {goals.map((g) => (
                      <span key={g} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-body text-muted-foreground">
                        {g}
                        <button onClick={() => removeGoal(g)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Exercises */}
              <div>
                <label className="font-display text-[10px] tracking-wider text-muted-foreground mb-2 block">EXERCISES</label>
                <div className="space-y-2">
                  {exercises.map((ex, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-secondary border border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <input value={ex.name} onChange={(e) => updateExercise(idx, "name", e.target.value)} placeholder="Exercise name"
                          className="flex-1 px-2 py-1.5 rounded bg-card border border-border text-foreground font-body text-xs focus:outline-none" />
                        <button onClick={() => removeExercise(idx)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[9px] font-body text-muted-foreground">Sets</span>
                          <input type="number" value={ex.sets} onChange={(e) => updateExercise(idx, "sets", Number(e.target.value))}
                            className="w-full px-2 py-1 rounded bg-card border border-border text-foreground font-body text-xs" />
                        </div>
                        <div>
                          <span className="text-[9px] font-body text-muted-foreground">Reps</span>
                          <input type="number" value={ex.reps || ""} onChange={(e) => updateExercise(idx, "reps", Number(e.target.value) || undefined)}
                            className="w-full px-2 py-1 rounded bg-card border border-border text-foreground font-body text-xs" />
                        </div>
                        <div>
                          <span className="text-[9px] font-body text-muted-foreground">Dur(s)</span>
                          <input type="number" value={ex.duration_sec || ""} onChange={(e) => updateExercise(idx, "duration_sec", Number(e.target.value) || undefined)}
                            className="w-full px-2 py-1 rounded bg-card border border-border text-foreground font-body text-xs" />
                        </div>
                      </div>
                      <input value={ex.notes} onChange={(e) => updateExercise(idx, "notes", e.target.value)} placeholder="Notes..."
                        className="w-full px-2 py-1.5 rounded bg-card border border-border text-foreground font-body text-xs focus:outline-none" />
                    </div>
                  ))}
                </div>
                <button onClick={addExercise} className="mt-2 w-full py-2 rounded-lg border border-dashed border-border text-muted-foreground font-display text-[10px] tracking-wider hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1">
                  <Plus size={12} /> ADD EXERCISE
                </button>
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={!title.trim() || saving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? "SAVING..." : "CREATE BLOCK"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateTrainingBlockDrawer;
