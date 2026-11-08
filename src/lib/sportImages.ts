import padelMatch from "@/assets/events/padel-match.jpg";
import tennisClay from "@/assets/events/tennis-clay.jpg";
import kidsCamp from "@/assets/events/kids-camp.jpg";
import clinicGroup from "@/assets/events/clinic-group.jpg";
import drillsGear from "@/assets/events/drills-gear.jpg";
import fitnessAgility from "@/assets/events/fitness-agility.jpg";
import fitnessStretch from "@/assets/events/fitness-stretch.jpg";
import racketClay from "@/assets/events/racket-clay.jpg";
import tennisAction from "@/assets/events/tennis-action.jpg";
import tennisPlayer from "@/assets/events/tennis-player.jpg";
import tennisServe from "@/assets/events/tennis-serve.jpg";
import tennisTraining from "@/assets/events/tennis-training.jpg";

const POOL = [
  padelMatch, tennisClay, clinicGroup, drillsGear, kidsCamp, fitnessAgility,
  fitnessStretch, racketClay, tennisAction, tennisPlayer, tennisServe, tennisTraining,
];

const CAMP = [kidsCamp, clinicGroup, tennisTraining];
const CLINIC = [clinicGroup, tennisTraining, kidsCamp];
const TOURNAMENT_TENNIS = [tennisClay, tennisAction, tennisServe];
const TOURNAMENT_PADEL = [padelMatch, drillsGear, racketClay];
const PADEL = [padelMatch, drillsGear, racketClay];
const TENNIS = [tennisClay, tennisAction, tennisServe, tennisPlayer];
const FITNESS = [fitnessAgility, fitnessStretch];
const DRILLS = [drillsGear, racketClay, tennisServe];

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

/** Pick from a pool by id so cards of the same type get different photos. */
const pick = (pool: string[], id: string) => pool[hash(id) % pool.length];

/** Fallback cover photo for an event, chosen by type and sport, stable per id. */
export function eventImage(e: { id: string; event_type?: string | null; sport?: string | null; title?: string | null }) {
  const t = (e.event_type || "").toLowerCase();
  const title = (e.title || "").toLowerCase();
  if (t === "camp" || title.includes("kids")) return pick(CAMP, e.id);
  if (t === "clinic" || t === "masterclass" || t === "group_session") return pick(CLINIC, e.id);
  if (t === "tournament") return e.sport === "tennis" ? pick(TOURNAMENT_TENNIS, e.id) : pick(TOURNAMENT_PADEL, e.id);
  if (e.sport === "padel") return pick(PADEL, e.id);
  if (e.sport === "tennis") return pick(TENNIS, e.id);
  return pick(POOL, e.id);
}

/** Cover photo for a marketplace program, chosen by category, stable per id. */
export function programImage(b: { id: string; category?: string | null; sport?: string | null }) {
  const c = (b.category || "").toLowerCase();
  if (c.includes("fitness") || c.includes("recovery") || c.includes("warm")) return pick(FITNESS, b.id);
  if (c.includes("drill") || c.includes("technique")) return pick(DRILLS, b.id);
  if (b.sport === "padel") return pick(PADEL, b.id);
  if (b.sport === "tennis") return pick(TENNIS, b.id);
  return pick(POOL, b.id);
}
