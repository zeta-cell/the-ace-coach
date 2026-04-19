// Single source of truth for module categories used across coach UI.
// We keep the legacy DB enum values intact and map them to 6 clean
// "main categories" that follow a coach's natural session flow.

export type MainCategory =
  | "warm_up"
  | "technique"
  | "tactics"
  | "fitness"
  | "mental"
  | "recovery";

export const MAIN_CATEGORIES: MainCategory[] = [
  "warm_up",
  "technique",
  "tactics",
  "fitness",
  "mental",
  "recovery",
];

export const MAIN_CATEGORY_LABEL: Record<MainCategory, string> = {
  warm_up: "Warm-Up",
  technique: "Technique",
  tactics: "Tactics",
  fitness: "Fitness",
  mental: "Mental",
  recovery: "Recovery",
};

export const MAIN_CATEGORY_DESCRIPTION: Record<MainCategory, string> = {
  warm_up: "Activation, mobility & light cardio to start the session",
  technique: "Stroke work — drills, video analysis, sport-specific skills",
  tactics: "Footwork, court coverage, decision-making & match prep",
  fitness: "Strength, endurance, power & speed conditioning",
  mental: "Focus, visualization, breathing & mental performance",
  recovery: "Cool-down, stretching, nutrition & regeneration",
};

// HSL-based semantic colors (referenced via tailwind utility classes).
// These already exist as ad-hoc colors in the app; centralized here.
export const MAIN_CATEGORY_COLORS: Record<MainCategory, { bg: string; text: string; dot: string }> = {
  warm_up:   { bg: "bg-yellow-500/15",  text: "text-yellow-500",  dot: "bg-yellow-500" },
  technique: { bg: "bg-cyan-500/15",    text: "text-cyan-500",    dot: "bg-cyan-500" },
  tactics:   { bg: "bg-blue-500/15",    text: "text-blue-500",    dot: "bg-blue-500" },
  fitness:   { bg: "bg-orange-500/15",  text: "text-orange-500",  dot: "bg-orange-500" },
  mental:    { bg: "bg-purple-500/15",  text: "text-purple-500",  dot: "bg-purple-500" },
  recovery:  { bg: "bg-green-500/15",   text: "text-green-500",   dot: "bg-green-500" },
};

// Maps legacy DB enum values onto the 6 main categories.
// Anything unknown falls back to "technique".
const LEGACY_TO_MAIN: Record<string, MainCategory> = {
  // module-level
  warm_up: "warm_up",
  padel_drill: "technique",
  tennis_drill: "technique",
  video: "technique",
  footwork: "tactics",
  fitness: "fitness",
  strength: "fitness",
  mental: "mental",
  recovery: "recovery",
  cool_down: "recovery",
  nutrition: "recovery",
  // block-level (training_blocks.category)
  beginner: "technique",
  technique: "technique",
  tactics: "tactics",
  defense: "tactics",
  net_play: "tactics",
  match_prep: "tactics",
  competition: "tactics",
  analysis: "tactics",
  power: "fitness",
  speed: "fitness",
  endurance: "fitness",
  express: "fitness",
  general: "technique",
};

export const toMainCategory = (raw?: string | null): MainCategory => {
  if (!raw) return "technique";
  return LEGACY_TO_MAIN[raw] ?? "technique";
};

// Optional secondary "stroke / focus" tags surfaced underneath the main filter.
export type StrokeTag =
  | "serve" | "forehand" | "backhand" | "volley" | "smash" | "lob"
  | "return" | "footwork" | "video";

export const STROKE_TAGS: { key: StrokeTag; label: string }[] = [
  { key: "serve",    label: "Serve" },
  { key: "return",   label: "Return" },
  { key: "forehand", label: "Forehand" },
  { key: "backhand", label: "Backhand" },
  { key: "volley",   label: "Volley" },
  { key: "smash",    label: "Smash" },
  { key: "lob",      label: "Lob" },
  { key: "footwork", label: "Footwork" },
  { key: "video",    label: "Video" },
];
