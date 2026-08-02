import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { SHOT_KEYS, Assessment } from "@/lib/assessments";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  playerId: string;
  playerName?: string;
  /** Previous assessment (for pre-filling and delta context) */
  previous?: Assessment | null;
  /** Assessment being edited, if any */
  editing?: Assessment | null;
  onSaved?: () => void;
}

const emptyState = (previous?: Assessment | null) => ({
  assessment_date: format(new Date(), "yyyy-MM-dd"),
  sport: previous?.sport || "padel",
  ...Object.fromEntries(SHOT_KEYS.map((s) => [s.key, previous?.[s.key] ?? 50])),
  overall_level: previous?.overall_level ?? null,
  level_system: previous?.level_system || "playtomic",
  summary: "",
  strengths: "",
  focus_areas: "",
  next_goals: "",
});

const AssessmentDrawer = ({ open, onClose, playerId, playerName, previous, editing, onSaved }: Props) => {
  const { user } = useAuth();
  const [form, setForm] = useState<any>(emptyState(previous));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        assessment_date: editing.assessment_date,
        sport: editing.sport,
        ...Object.fromEntries(SHOT_KEYS.map((s) => [s.key, editing[s.key] ?? 50])),
        overall_level: editing.overall_level,
        level_system: editing.level_system || "playtomic",
        summary: editing.summary || "",
        strengths: editing.strengths || "",
        focus_areas: editing.focus_areas || "",
        next_goals: editing.next_goals || "",
      });
    } else {
      setForm(emptyState(previous));
    }
  }, [open, editing, previous]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      ...form,
      overall_level: form.overall_level === null || form.overall_level === "" ? null : Number(form.overall_level),
      player_id: playerId,
      coach_id: user.id,
    };
    const { error } = editing
      ? await supabase.from("player_assessments").update(payload).eq("id", editing.id)
      : await supabase.from("player_assessments").insert(payload);

    if (error) {
      toast.error("Could not save assessment", { description: error.message });
    } else {
      // Keep the player's live matrix in sync with the latest assessment.
      await supabase
        .from("player_profiles")
        .update({
          volley_pct: payload.volley_pct,
          forehand_pct: payload.forehand_pct,
          serve_pct: payload.serve_pct,
          smash_pct: payload.smash_pct,
          backhand_pct: payload.backhand_pct,
          lob_pct: payload.lob_pct,
          shot_data_source: "coach",
        })
        .eq("user_id", playerId);
      toast.success(editing ? "Assessment updated" : "Assessment saved");
      onSaved?.();
      onClose();
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 h-14">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={18} className="text-primary" />
                <span className="font-display text-sm tracking-wider text-foreground">
                  {editing ? "EDIT ASSESSMENT" : "NEW ASSESSMENT"}
                  {playerName ? ` · ${playerName.toUpperCase()}` : ""}
                </span>
              </div>
              <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6 max-w-2xl mx-auto pb-[calc(env(safe-area-inset-bottom)+2rem)]">
              {/* Date + sport + level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">DATE</label>
                  <input
                    type="date"
                    value={form.assessment_date}
                    onChange={(e) => set("assessment_date", e.target.value)}
                    className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">SPORT</label>
                  <select
                    value={form.sport}
                    onChange={(e) => set("sport", e.target.value)}
                    className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
                  >
                    <option value="padel">Padel</option>
                    <option value="tennis">Tennis</option>
                  </select>
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">OVERALL LEVEL</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="e.g. 3.25"
                    value={form.overall_level ?? ""}
                    onChange={(e) => set("overall_level", e.target.value)}
                    className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">LEVEL SYSTEM</label>
                  <select
                    value={form.level_system}
                    onChange={(e) => set("level_system", e.target.value)}
                    className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground"
                  >
                    <option value="playtomic">Playtomic</option>
                    <option value="ntrp">USTA / NTRP</option>
                    <option value="internal">Internal 1-10</option>
                  </select>
                </div>
              </div>

              {/* Shot sliders */}
              <div>
                <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3">SHOT RATINGS</h3>
                <div className="space-y-4">
                  {SHOT_KEYS.map((s) => {
                    const value = Number(form[s.key]) || 0;
                    const prev = previous ? Number(previous[s.key]) || 0 : null;
                    const delta = prev !== null ? value - prev : null;
                    return (
                      <div key={s.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-body text-xs text-foreground">{s.label}</span>
                          <span className="flex items-center gap-2 font-display text-xs text-foreground">
                            {value}%
                            {delta !== null && delta !== 0 && (
                              <span className={delta > 0 ? "text-emerald-400" : "text-rose-400"}>
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            )}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={value}
                          onChange={(e) => set(s.key, Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Text blocks */}
              {[
                { key: "summary", label: "ASSESSMENT NOTES", ph: "How the training week went, what stood out…" },
                { key: "strengths", label: "STRENGTHS", ph: "What the player does well" },
                { key: "focus_areas", label: "FOCUS AREAS", ph: "What to improve next" },
                { key: "next_goals", label: "NEXT GOALS", ph: "Concrete goals until the next assessment" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">{f.label}</label>
                  <textarea
                    rows={f.key === "summary" ? 4 : 2}
                    placeholder={f.ph}
                    value={form[f.key] || ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground resize-none"
                  />
                </div>
              ))}

              <button
                onClick={save}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-xs tracking-wider text-primary-foreground disabled:opacity-60"
              >
                <Save size={16} /> {saving ? "SAVING…" : editing ? "UPDATE ASSESSMENT" : "SAVE ASSESSMENT"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssessmentDrawer;
