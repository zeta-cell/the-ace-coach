import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ClipboardCheck, Plus, Pencil, TrendingUp, Target, Flag, Sparkles } from "lucide-react";
import { SHOT_KEYS, Assessment, assessmentAverage, deltaColor, formatDelta } from "@/lib/assessments";

interface Props {
  playerId: string;
  /** Coach mode shows the "new assessment" and edit controls. */
  canEdit?: boolean;
  onNew?: (previous: Assessment | null) => void;
  onEdit?: (assessment: Assessment) => void;
  refreshKey?: number;
}

const AssessmentHistory = ({ playerId, canEdit, onNew, onEdit, refreshKey = 0 }: Props) => {
  const [items, setItems] = useState<Assessment[]>([]);
  const [coaches, setCoaches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("player_assessments")
        .select("*")
        .eq("player_id", playerId)
        .order("assessment_date", { ascending: false });
      if (!active) return;
      const list = (data || []) as Assessment[];
      setItems(list);
      setOpenId(list[0]?.id ?? null);
      const ids = Array.from(new Set(list.map((a) => a.coach_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
        if (!active) return;
        const map: Record<string, string> = {};
        (profs || []).forEach((p) => {
          map[p.user_id as string] = (p.full_name as string) || "Coach";
        });
        setCoaches(map);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [playerId, refreshKey]);

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 font-display text-xs tracking-wider text-muted-foreground">
          <ClipboardCheck size={14} className="text-primary" /> ASSESSMENTS
        </h3>
        {canEdit && (
          <button
            onClick={() => onNew?.(items[0] ?? null)}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-display text-[10px] tracking-wider text-primary-foreground"
          >
            <Plus size={12} /> NEW ASSESSMENT
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="font-body text-sm text-muted-foreground">
            No assessment yet. {canEdit ? "Rate the player's training week to start their development history." : "Your coach will publish your first assessment soon."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => {
            const prev = items[i + 1] || null;
            const avg = assessmentAverage(a);
            const avgDelta = prev ? avg - assessmentAverage(prev) : null;
            const isOpen = openId === a.id;
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : a.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <div>
                    <p className="font-display text-sm text-foreground">
                      {format(parseISO(a.assessment_date), "dd MMM yyyy")}
                    </p>
                    <p className="font-body text-[11px] text-muted-foreground capitalize">
                      {a.sport}
                      {a.overall_level != null && ` · level ${a.overall_level}`}
                      {i === 0 && " · latest"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-foreground">{avg}%</p>
                    {avgDelta !== null && (
                      <p className={`font-display text-[11px] ${deltaColor(avgDelta)}`}>
                        {formatDelta(avgDelta)} vs. previous
                      </p>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                      {SHOT_KEYS.map((s) => {
                        const value = Number(a[s.key]) || 0;
                        const d = prev ? value - (Number(prev[s.key]) || 0) : null;
                        return (
                          <div key={s.key}>
                            <div className="flex items-baseline justify-between">
                              <span className="font-body text-[11px] text-muted-foreground">{s.label}</span>
                              {d !== null && (
                                <span className={`font-display text-[10px] ${deltaColor(d)}`}>{formatDelta(d)}</span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                              </div>
                              <span className="font-display text-[11px] text-foreground w-8 text-right">{value}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {a.summary && (
                      <div>
                        <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-1">COACH NOTES</p>
                        <p className="font-body text-sm text-foreground whitespace-pre-line">{a.summary}</p>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { icon: TrendingUp, label: "STRENGTHS", value: a.strengths, color: "text-emerald-400" },
                        { icon: Target, label: "FOCUS AREAS", value: a.focus_areas, color: "text-amber-400" },
                        { icon: Flag, label: "NEXT GOALS", value: a.next_goals, color: "text-sky-400" },
                      ]
                        .filter((b) => b.value)
                        .map((b) => (
                          <div key={b.label} className="rounded-lg bg-secondary/60 p-3">
                            <p className={`flex items-center gap-1 font-display text-[10px] tracking-wider ${b.color} mb-1`}>
                              <b.icon size={11} /> {b.label}
                            </p>
                            <p className="font-body text-xs text-foreground whitespace-pre-line">{b.value}</p>
                          </div>
                        ))}
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => onEdit?.(a)}
                        className="flex items-center gap-1 font-display text-[10px] tracking-wider text-muted-foreground hover:text-foreground"
                      >
                        <Pencil size={11} /> EDIT
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length > 1 && (
        <p className="mt-3 flex items-center gap-1 font-body text-[11px] text-muted-foreground">
          <Sparkles size={11} className="text-primary" /> Green means improvement since the previous assessment, red means it dropped.
        </p>
      )}
    </div>
  );
};

export default AssessmentHistory;
