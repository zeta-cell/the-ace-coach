export const SHOT_KEYS = [
  { key: "volley_pct", label: "Volley" },
  { key: "forehand_pct", label: "Forehand" },
  { key: "serve_pct", label: "Serve" },
  { key: "smash_pct", label: "Smash" },
  { key: "backhand_pct", label: "Backhand" },
  { key: "lob_pct", label: "Lob" },
] as const;

export type ShotKey = (typeof SHOT_KEYS)[number]["key"];

export interface Assessment {
  id: string;
  player_id: string;
  coach_id: string;
  assessment_date: string;
  sport: string;
  volley_pct: number;
  forehand_pct: number;
  serve_pct: number;
  smash_pct: number;
  backhand_pct: number;
  lob_pct: number;
  overall_level: number | null;
  level_system: string | null;
  summary: string | null;
  strengths: string | null;
  focus_areas: string | null;
  next_goals: string | null;
  created_at: string;
}

/** Average of the six shot ratings. */
export const assessmentAverage = (a: Assessment) =>
  Math.round(SHOT_KEYS.reduce((sum, s) => sum + (Number(a[s.key]) || 0), 0) / SHOT_KEYS.length);

/** Tailwind text color for a development delta. */
export const deltaColor = (delta: number) =>
  delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-muted-foreground";

export const formatDelta = (delta: number) => (delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "±0");
