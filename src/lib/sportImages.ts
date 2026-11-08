import padelMatch from "@/assets/events/padel-match.jpg";
import tennisClay from "@/assets/events/tennis-clay.jpg";
import kidsCamp from "@/assets/events/kids-camp.jpg";
import clinicGroup from "@/assets/events/clinic-group.jpg";
import drillsGear from "@/assets/events/drills-gear.jpg";
import fitnessAgility from "@/assets/events/fitness-agility.jpg";

const POOL = [padelMatch, tennisClay, clinicGroup, drillsGear, kidsCamp, fitnessAgility];

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

/** Fallback cover photo for an event, chosen by type and sport, stable per id. */
export function eventImage(e: { id: string; event_type?: string | null; sport?: string | null; title?: string | null }) {
  const t = (e.event_type || "").toLowerCase();
  const title = (e.title || "").toLowerCase();
  if (t === "camp" || title.includes("kids")) return kidsCamp;
  if (t === "clinic" || t === "masterclass" || t === "group_session") return clinicGroup;
  if (t === "tournament") return e.sport === "tennis" ? tennisClay : padelMatch;
  if (e.sport === "padel") return padelMatch;
  if (e.sport === "tennis") return tennisClay;
  return POOL[hash(e.id) % POOL.length];
}

/** Cover photo for a marketplace program, chosen by category, stable per id. */
export function programImage(b: { id: string; category?: string | null; sport?: string | null }) {
  const c = (b.category || "").toLowerCase();
  if (c.includes("fitness") || c.includes("recovery") || c.includes("warm")) return fitnessAgility;
  if (c.includes("drill") || c.includes("technique")) return drillsGear;
  if (b.sport === "padel") return [padelMatch, drillsGear][hash(b.id) % 2];
  if (b.sport === "tennis") return [tennisClay, clinicGroup][hash(b.id) % 2];
  return POOL[hash(b.id) % POOL.length];
}
