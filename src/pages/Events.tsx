import { useState, useEffect, useMemo } from "react";
import PublicHeader from "@/components/PublicHeader";
import PublicBottomNav from "@/components/PublicBottomNav";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Search, Calendar, Users, Globe, SlidersHorizontal, X,
  CheckCircle, ChevronRight, Target, Trophy, GraduationCap, Tent,
  Video, Zap, Sparkles, RotateCcw,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

interface EventRow {
  id: string; coach_id: string; title: string; description: string | null;
  event_type: string; sport: string; start_datetime: string; end_datetime: string;
  location_name: string | null; location_city: string | null; location_country: string | null;
  is_online: boolean; max_participants: number | null; min_participants: number | null;
  current_participants: number; price_per_person: number; currency: string;
  age_group: string; skill_level: string;
  level_min: number | null; level_max: number | null;
  cover_image_url: string | null; status: string; club_id: string | null;
  coach_name?: string; coach_avatar?: string | null; academy_name?: string | null;
}

const TYPE_META: Record<string, { color: string; gradient: string; icon: typeof Target }> = {
  clinic: { color: "bg-blue-500/20 text-blue-400", gradient: "from-blue-600/80 to-blue-900/80", icon: Target },
  camp: { color: "bg-emerald-500/20 text-emerald-400", gradient: "from-emerald-600/80 to-emerald-900/80", icon: Tent },
  group_session: { color: "bg-violet-500/20 text-violet-400", gradient: "from-violet-600/80 to-violet-900/80", icon: Users },
  private_lesson: { color: "bg-primary/20 text-primary", gradient: "from-primary/70 to-primary/30", icon: Zap },
  masterclass: { color: "bg-amber-500/20 text-amber-400", gradient: "from-amber-600/80 to-amber-900/80", icon: GraduationCap },
  tournament: { color: "bg-red-500/20 text-red-400", gradient: "from-red-600/80 to-red-900/80", icon: Trophy },
  webinar: { color: "bg-sky-500/20 text-sky-400", gradient: "from-sky-600/80 to-sky-900/80", icon: Video },
};

const FORMAT_TABS = [
  { key: "all", label: "ALL" },
  { key: "clinic", label: "CLINICS" },
  { key: "camp", label: "CAMPS" },
  { key: "private_lesson", label: "PRIVATE" },
  { key: "group_session", label: "GROUP" },
  { key: "academy", label: "ACADEMIES" },
  { key: "tournament", label: "TOURNAMENTS" },
  { key: "online", label: "ONLINE" },
];

const SPORTS = ["All", "Tennis", "Padel"];
const AGES = ["All", "kids", "junior", "adult"];
const VENUES = ["All", "Indoor / on court", "Online"];
const WHENS = [
  { key: "any", label: "Any time" },
  { key: "7", label: "Next 7 days" },
  { key: "30", label: "Next 30 days" },
  { key: "90", label: "Next 3 months" },
];
const SORTS = [
  { key: "soonest", label: "Soonest first" },
  { key: "cheapest", label: "Lowest price" },
  { key: "popular", label: "Most popular" },
  { key: "spots", label: "Fewest spots left" },
];

const currencySymbol = (c: string) => ({ EUR: "€", USD: "$", GBP: "£" }[c] || c);
const fmtType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
const lvl = (v: number | null) => (v == null ? null : String(v).replace(/\.?0+$/, ""));

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [registering, setRegistering] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [format_, setFormat] = useState("all");
  const [sport, setSport] = useState("All");
  const [age, setAge] = useState("All");
  const [venue, setVenue] = useState("All");
  const [when, setWhen] = useState("any");
  const [maxPrice, setMaxPrice] = useState(300);
  const [playerLevel, setPlayerLevel] = useState(0);
  const [freeOnly, setFreeOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("soonest");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { if (user) fetchRegistrations(); }, [user]);
  useEffect(() => {
    import("@/lib/seo").then(({ setSeo }) => setSeo({
      title: "Tennis & Padel Clinics, Camps & Classes | Hi Volley",
      description: "Find coach-led clinics, camps, private lessons, academy programmes, tournaments and online classes for tennis and padel — filter by level, city, date and price.",
      path: "/events",
    }));
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "full"])
      .gte("start_datetime", new Date().toISOString())
      .order("start_datetime");

    if (data && data.length > 0) {
      const coachIds = [...new Set(data.map((e) => e.coach_id))];
      const clubIds = [...new Set(data.map((e) => e.club_id).filter(Boolean))] as string[];
      const [{ data: profiles }, { data: academies }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", coachIds),
        clubIds.length
          ? supabase.from("academies").select("club_id, name").in("club_id", clubIds)
          : Promise.resolve({ data: [] as { club_id: string; name: string }[] }),
      ]);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      const academyMap = new Map((academies || []).map((a) => [a.club_id, a.name]));
      setEvents(
        data.map((e) => ({
          ...e,
          coach_name: profileMap.get(e.coach_id)?.full_name || "Coach",
          coach_avatar: profileMap.get(e.coach_id)?.avatar_url || null,
          academy_name: e.club_id ? academyMap.get(e.club_id) || null : null,
        })) as unknown as EventRow[],
      );
    } else {
      setEvents([]);
    }
    setLoading(false);
  };

  const fetchRegistrations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("player_id", user.id)
      .eq("status", "registered");
    setRegisteredIds(new Set((data || []).map((r) => r.event_id)));
  };

  const handleRegister = async (event: EventRow) => {
    if (!user) { navigate(`/login?redirect=/class/${event.id}`); return; }
    if (registeredIds.has(event.id)) return;
    setRegistering(event.id);
    const isFree = Number(event.price_per_person) === 0;
    const { error } = await supabase.from("event_registrations").insert({
      event_id: event.id,
      player_id: user.id,
      status: "registered",
      payment_status: isFree ? "paid" : "pending",
      amount_paid: isFree ? 0 : Number(event.price_per_person),
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already registered!" : error.message);
      setRegistering(null);
      return;
    }
    await Promise.all([
      supabase.rpc("award_xp", { p_user_id: user.id, p_amount: 30, p_event_type: "event_registration", p_description: `Registered for ${event.title}` }),
      supabase.rpc("increment_raffle_tickets", { p_user_id: user.id }),
    ]);
    setRegisteredIds((prev) => new Set([...prev, event.id]));
    toast.success("You're registered! See you on court.");
    setRegistering(null);
    fetchEvents();
  };

  const resetFilters = () => {
    setSport("All"); setAge("All"); setVenue("All"); setWhen("any");
    setMaxPrice(300); setPlayerLevel(0); setFreeOnly(false); setAvailableOnly(false);
    setSortBy("soonest");
  };

  const activeCount = [
    sport !== "All", age !== "All", venue !== "All", when !== "any",
    maxPrice < 300, playerLevel > 0, freeOnly, availableOnly,
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    let result = [...events];
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((e) =>
        [e.title, e.location_city, e.location_name, e.coach_name, e.academy_name, e.description]
          .some((f) => f?.toLowerCase().includes(q)),
      );
    }
    if (format_ === "online") result = result.filter((e) => e.is_online);
    else if (format_ === "academy") result = result.filter((e) => !!e.academy_name);
    else if (format_ !== "all") result = result.filter((e) => e.event_type === format_);

    if (sport !== "All") result = result.filter((e) => e.sport === sport.toLowerCase() || e.sport === "both");
    if (age !== "All") result = result.filter((e) => e.age_group === age || e.age_group === "all");
    if (venue === "Online") result = result.filter((e) => e.is_online);
    if (venue === "Indoor / on court") result = result.filter((e) => !e.is_online);
    if (when !== "any") {
      const until = addDays(new Date(), Number(when));
      result = result.filter((e) => new Date(e.start_datetime) <= until);
    }
    if (freeOnly) result = result.filter((e) => Number(e.price_per_person) === 0);
    else if (maxPrice < 300) result = result.filter((e) => Number(e.price_per_person) <= maxPrice);
    if (playerLevel > 0) {
      result = result.filter(
        (e) => (e.level_min == null || playerLevel >= Number(e.level_min)) &&
               (e.level_max == null || playerLevel <= Number(e.level_max)),
      );
    }
    if (availableOnly) {
      result = result.filter((e) => e.status !== "full" && (!e.max_participants || e.current_participants < e.max_participants));
    }

    switch (sortBy) {
      case "cheapest": result.sort((a, b) => Number(a.price_per_person) - Number(b.price_per_person)); break;
      case "popular": result.sort((a, b) => b.current_participants - a.current_participants); break;
      case "spots":
        result.sort((a, b) => {
          const s = (e: EventRow) => (e.max_participants ? e.max_participants - e.current_participants : 99);
          return s(a) - s(b);
        });
        break;
    }
    return result;
  }, [events, search, format_, sport, age, venue, when, maxPrice, playerLevel, freeOnly, availableOnly, sortBy]);

  const featured = useMemo(() => {
    const soon = addDays(new Date(), 7);
    return events.filter((e) => new Date(e.start_datetime) <= soon).slice(0, 8);
  }, [events]);

  const EventCard = ({ event, large = false }: { event: EventRow; large?: boolean }) => {
    const spots = event.max_participants ? event.max_participants - event.current_participants : null;
    const isRegistered = registeredIds.has(event.id);
    const isFull = event.status === "full" || spots === 0;
    const isFree = Number(event.price_per_person) === 0;
    const meta = TYPE_META[event.event_type] || TYPE_META.clinic;
    const TypeIcon = meta.icon;
    const lo = lvl(event.level_min);
    const hi = lvl(event.level_max);

    return (
      <motion.div
        initial={false}
        className={`group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 ${large ? "min-w-[300px] shrink-0" : ""}`}
      >
        <Link to={`/class/${event.id}`} className="block">
          <div className={`relative flex h-28 items-end bg-gradient-to-br ${meta.gradient} p-4`}>
            {event.cover_image_url && (
              <img src={event.cover_image_url} alt={event.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70" />
            )}
            <span className={`absolute left-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[10px] tracking-wider ${meta.color}`}>
              <TypeIcon size={10} /> {fmtType(event.event_type).toUpperCase()}
            </span>
            <span className="absolute right-3 top-3 rounded-full bg-card/60 px-2 py-0.5 font-display text-[10px] tracking-wider text-foreground backdrop-blur">
              {event.sport.toUpperCase()}
            </span>
            {event.is_online && (
              <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-card/60 px-2 py-0.5 font-display text-[10px] tracking-wider text-sky-300 backdrop-blur">
                <Globe size={10} /> ONLINE
              </span>
            )}
          </div>
        </Link>

        <div className="space-y-3 p-4">
          <Link to={`/class/${event.id}`}>
            <h3 className="line-clamp-2 font-display text-base tracking-wider text-foreground group-hover:text-primary">{event.title}</h3>
          </Link>

          <div className="flex items-center gap-2">
            {event.coach_avatar ? (
              <img src={event.coach_avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/20">
                <span className="font-display text-[10px] text-primary">{event.coach_name?.charAt(0)}</span>
              </div>
            )}
            <span className="truncate font-body text-xs text-muted-foreground">
              {event.coach_name}{event.academy_name ? ` · ${event.academy_name}` : ""}
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="flex items-center gap-2 font-body text-xs text-muted-foreground">
              <Calendar size={12} /> {format(new Date(event.start_datetime), "EEE, d MMM · HH:mm")} – {format(new Date(event.end_datetime), "HH:mm")}
            </p>
            <p className="flex items-center gap-2 font-body text-xs text-muted-foreground">
              <MapPin size={12} /> {event.is_online ? "Online session" : event.location_name || event.location_city || "TBA"}
            </p>
            <p className="flex items-center gap-2 font-body text-xs text-muted-foreground">
              <Users size={12} /> {event.current_participants}{event.max_participants ? `/${event.max_participants}` : ""} players
              {event.min_participants ? ` · from ${event.min_participants}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(lo || hi) && (
              <span className="rounded-full bg-secondary px-2 py-0.5 font-display text-[10px] tracking-wider text-muted-foreground">
                LEVEL {lo || "0"}–{hi || "10"}
              </span>
            )}
            {event.age_group !== "all" && (
              <span className="rounded-full bg-secondary px-2 py-0.5 font-display text-[10px] tracking-wider text-muted-foreground">{event.age_group.toUpperCase()}</span>
            )}
            {event.skill_level !== "all" && (
              <span className="rounded-full bg-secondary px-2 py-0.5 font-display text-[10px] tracking-wider text-muted-foreground">{event.skill_level.toUpperCase()}</span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-2">
            <div>
              {spots !== null && spots > 0 && spots < 5 && <p className="font-display text-[10px] text-amber-500">{spots} spots left</p>}
              {isFull && <p className="font-display text-[10px] text-red-400">FULL</p>}
              <p className={`font-display text-lg ${isFree ? "text-emerald-500" : "text-foreground"}`}>
                {isFree ? "Free" : `${currencySymbol(event.currency)}${Number(event.price_per_person)}`}
              </p>
            </div>

            {isRegistered ? (
              <Link to={`/class/${event.id}`} className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 font-display text-[10px] tracking-wider text-emerald-500">
                <CheckCircle size={10} /> REGISTERED
              </Link>
            ) : isFull ? (
              <Link to={`/class/${event.id}`} className="rounded-lg bg-muted px-3 py-1.5 font-display text-[10px] tracking-wider text-muted-foreground">
                VIEW
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to={`/class/${event.id}`} className="rounded-lg bg-secondary px-2.5 py-2 font-display text-[10px] tracking-wider text-foreground">
                  DETAILS
                </Link>
                <button
                  onClick={() => handleRegister(event)}
                  disabled={registering === event.id}
                  className="rounded-lg bg-primary px-3 py-2 font-display text-[10px] tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {registering === event.id ? "…" : "JOIN"}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full font-display text-[10px] tracking-wider border transition-colors ${
      active ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"
    }`;

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground">
      <PublicHeader />

      <div className="relative overflow-hidden border-b border-border bg-card px-4 py-12 text-center">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <h1 className="relative mb-3 font-display text-3xl text-foreground md:text-5xl">CLASSES & CLINICS</h1>
        <p className="relative mx-auto max-w-2xl font-body text-sm text-muted-foreground md:text-base">
          Clinics, camps, private lessons, academy programmes, tournaments and online sessions — filtered to your level.
        </p>
      </div>

      {/* Sticky search + format tabs */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <Search size={16} className="shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city, coach, academy or title…"
                className="flex-1 bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search"><X size={14} className="text-muted-foreground" /></button>
              )}
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="relative flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 font-display text-[10px] tracking-wider text-foreground"
            >
              <SlidersHorizontal size={14} /> FILTERS
              {activeCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary font-display text-[9px] text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
            {FORMAT_TABS.map((t) => (
              <button key={t.key} onClick={() => setFormat(t.key)} className={`${chip(format_ === t.key)} whitespace-nowrap`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6">
        {featured.length > 0 && format_ === "all" && !search && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm tracking-wider text-muted-foreground">
              <Sparkles size={14} className="text-primary" /> HAPPENING THIS WEEK
            </h2>
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4">
              {featured.map((e) => <EventCard key={e.id} event={e} large />)}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "CLASS" : "CLASSES"}
            </h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 font-display text-[10px] tracking-wider text-foreground"
            >
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="font-display text-lg text-foreground">Nothing matches those filters</p>
              <button onClick={resetFilters} className="mt-3 inline-flex items-center gap-1.5 font-display text-[11px] tracking-wider text-primary">
                <RotateCcw size={12} /> RESET FILTERS
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </section>
      </div>

      {/* Filter bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5"
            >
              <div className="mx-auto max-w-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base tracking-wider text-foreground">FILTERS</h2>
                  <button onClick={() => setSheetOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </div>

                <div>
                  <p className="mb-2 font-display text-[10px] tracking-wider text-muted-foreground">SPORT</p>
                  <div className="flex flex-wrap gap-2">
                    {SPORTS.map((s) => <button key={s} onClick={() => setSport(s)} className={chip(sport === s)}>{s.toUpperCase()}</button>)}
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-display text-[10px] tracking-wider text-muted-foreground">WHEN</p>
                  <div className="flex flex-wrap gap-2">
                    {WHENS.map((w) => <button key={w.key} onClick={() => setWhen(w.key)} className={chip(when === w.key)}>{w.label.toUpperCase()}</button>)}
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-display text-[10px] tracking-wider text-muted-foreground">SETTING</p>
                  <div className="flex flex-wrap gap-2">
                    {VENUES.map((v) => <button key={v} onClick={() => setVenue(v)} className={chip(venue === v)}>{v.toUpperCase()}</button>)}
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-display text-[10px] tracking-wider text-muted-foreground">AGE GROUP</p>
                  <div className="flex flex-wrap gap-2">
                    {AGES.map((a) => <button key={a} onClick={() => setAge(a)} className={chip(age === a)}>{a.toUpperCase()}</button>)}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-display text-[10px] tracking-wider text-muted-foreground">MY LEVEL</p>
                    <span className="font-body text-xs text-foreground">{playerLevel === 0 ? "Any" : playerLevel.toFixed(1)}</span>
                  </div>
                  <input
                    type="range" min={0} max={7} step={0.25}
                    value={playerLevel} onChange={(e) => setPlayerLevel(Number(e.target.value))}
                    aria-label="My level"
                    className="w-full accent-primary"
                  />
                  <p className="mt-1 font-body text-[11px] text-muted-foreground">Only shows classes that accept your level.</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-display text-[10px] tracking-wider text-muted-foreground">MAX PRICE</p>
                    <span className="font-body text-xs text-foreground">{maxPrice >= 300 ? "Any" : `€${maxPrice}`}</span>
                  </div>
                  <input
                    type="range" min={0} max={300} step={5}
                    value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
                    disabled={freeOnly} aria-label="Max price"
                    className="w-full accent-primary disabled:opacity-40"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setFreeOnly((v) => !v)} className={chip(freeOnly)}>FREE ONLY</button>
                  <button onClick={() => setAvailableOnly((v) => !v)} className={chip(availableOnly)}>SPOTS AVAILABLE</button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={resetFilters} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary py-3 font-display text-[11px] tracking-wider text-foreground">
                    <RotateCcw size={13} /> RESET
                  </button>
                  <button onClick={() => setSheetOpen(false)} className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-primary py-3 font-display text-[11px] tracking-wider text-primary-foreground">
                    SHOW {filtered.length} CLASSES <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PublicBottomNav />
    </div>
  );
};

export default Events;
