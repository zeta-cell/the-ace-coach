import { useState, useEffect, useMemo } from "react";
import PublicHeader from "@/components/PublicHeader";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  MapPin, Search, Calendar, Clock, Users, Globe, ChevronRight,
  Zap, Star, Crown, Shield, Award, CheckCircle,
} from "lucide-react";
import PublicBottomNav from "@/components/PublicBottomNav";
import { format, isWithinInterval, addDays } from "date-fns";
import { toast } from "sonner";

interface EventRow {
  id: string; coach_id: string; title: string; description: string | null;
  event_type: string; sport: string; start_datetime: string; end_datetime: string;
  location_name: string | null; location_address: string | null;
  location_city: string | null; location_country: string | null;
  is_online: boolean; max_participants: number | null;
  current_participants: number; price_per_person: number;
  currency: string; age_group: string; skill_level: string;
  cover_image_url: string | null; status: string;
  created_at: string; updated_at: string;
  coach_name?: string; coach_avatar?: string | null;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  clinic: "bg-blue-500/20 text-blue-400",
  camp: "bg-emerald-500/20 text-emerald-400",
  group_session: "bg-violet-500/20 text-violet-400",
  masterclass: "bg-amber-500/20 text-amber-400",
  tournament: "bg-red-500/20 text-red-400",
  webinar: "bg-gray-500/20 text-gray-400",
};

const EVENT_TYPE_GRADIENTS: Record<string, string> = {
  clinic: "from-blue-600/80 to-blue-900/80",
  camp: "from-emerald-600/80 to-emerald-900/80",
  group_session: "from-violet-600/80 to-violet-900/80",
  masterclass: "from-amber-600/80 to-amber-900/80",
  tournament: "from-red-600/80 to-red-900/80",
  webinar: "from-gray-600/80 to-gray-900/80",
};

const EVENT_TYPES = ["All", "clinic", "camp", "group_session", "masterclass", "tournament", "webinar"];
const SPORT_FILTERS = ["All", "Tennis", "Padel"];
const LEVEL_FILTERS = ["All", "Beginner", "Intermediate", "Advanced"];
const AGE_FILTERS = ["All", "Kids", "Junior", "Adult"];
const SORT_OPTIONS = [
  { key: "soonest", label: "Soonest" },
  { key: "cheapest", label: "Cheapest" },
  { key: "popular", label: "Most Popular" },
];

const currencySymbol = (c: string) => ({ EUR: "€", USD: "$", GBP: "£" }[c] || c);
const formatEventType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [registering, setRegistering] = useState<string | null>(null);

  const [citySearch, setCitySearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sportFilter, setSportFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("soonest");

  useEffect(() => { fetchEvents(); }, []);
  useEffect(() => { if (user) fetchRegistrations(); }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "full"])
      .gte("start_datetime", new Date().toISOString())
      .order("start_datetime");

    if (data && data.length > 0) {
      const coachIds = [...new Set(data.map(e => e.coach_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", coachIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setEvents(data.map(e => ({
        ...e,
        coach_name: profileMap.get(e.coach_id)?.full_name || "Coach",
        coach_avatar: profileMap.get(e.coach_id)?.avatar_url || null,
      })));
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
    setRegisteredIds(new Set((data || []).map(r => r.event_id)));
  };

  const handleRegister = async (event: EventRow) => {
    if (!user) { navigate("/login?redirect=/events"); return; }
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
      toast.error(error.message.includes("duplicate") ? "Already registered!" : "Registration failed");
      setRegistering(null);
      return;
    }

    // Award XP + raffle ticket
    await Promise.all([
      supabase.rpc("award_xp", { p_user_id: user.id, p_amount: 30, p_event_type: "event_registration", p_description: `Registered for ${event.title}` }),
      supabase.rpc("increment_raffle_tickets", { p_user_id: user.id }),
      supabase.from("notifications").insert({ user_id: user.id, title: `You're registered for ${event.title}!`, body: `See you there!`, link: "/events" }),
      supabase.from("notifications").insert({ user_id: event.coach_id, title: `New registration for ${event.title}`, body: "A player just registered for your event", link: "/coach/events" }),
    ]);

    setRegisteredIds(prev => new Set([...prev, event.id]));
    toast.success("You're registered! See you there!");
    setRegistering(null);
    fetchEvents();
  };

  const handleCancel = async (eventId: string) => {
    if (!user) return;
    await supabase.from("event_registrations")
      .update({ status: "cancelled" })
      .eq("event_id", eventId)
      .eq("player_id", user.id);
    setRegisteredIds(prev => { const s = new Set(prev); s.delete(eventId); return s; });
    toast.success("Registration cancelled");
    fetchEvents();
  };

  const filtered = useMemo(() => {
    let result = [...events];
    if (citySearch) result = result.filter(e => e.location_city?.toLowerCase().includes(citySearch.toLowerCase()));
    if (typeFilter !== "All") result = result.filter(e => e.event_type === typeFilter);
    if (sportFilter !== "All") result = result.filter(e => e.sport === sportFilter.toLowerCase() || e.sport === "both");
    if (levelFilter !== "All") result = result.filter(e => e.skill_level === levelFilter.toLowerCase() || e.skill_level === "all");
    if (ageFilter !== "All") result = result.filter(e => e.age_group === ageFilter.toLowerCase() || e.age_group === "all");
    switch (sortBy) {
      case "cheapest": result.sort((a, b) => Number(a.price_per_person) - Number(b.price_per_person)); break;
      case "popular": result.sort((a, b) => b.current_participants - a.current_participants); break;
    }
    return result;
  }, [events, citySearch, typeFilter, sportFilter, levelFilter, ageFilter, sortBy]);

  const featured = useMemo(() => {
    const soon = addDays(new Date(), 7);
    return events.filter(e => e.current_participants > 0 && new Date(e.start_datetime) <= soon);
  }, [events]);

  const spotsLeft = (e: EventRow) => e.max_participants ? e.max_participants - e.current_participants : null;

  const EventCard = ({ event, large = false }: { event: EventRow; large?: boolean }) => {
    const spots = spotsLeft(event);
    const isRegistered = registeredIds.has(event.id);
    const isFull = event.status === "full";
    const isFree = Number(event.price_per_person) === 0;
    const gradient = EVENT_TYPE_GRADIENTS[event.event_type] || EVENT_TYPE_GRADIENTS.clinic;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all ${large ? "min-w-[300px] shrink-0" : ""}`}
      >
        {/* Cover gradient */}
        <div className={`h-28 bg-gradient-to-br ${gradient} relative flex items-end p-4`}>
          <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-display tracking-wider ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.clinic}`}>
            {formatEventType(event.event_type).toUpperCase()}
          </span>
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-card/50 backdrop-blur text-[10px] font-display tracking-wider text-foreground">
            {event.sport.toUpperCase()}
          </span>
        </div>

        <div className="p-4 space-y-3">
          <h3 className="font-display text-base tracking-wider text-foreground line-clamp-2">{event.title}</h3>

          <div className="flex items-center gap-2">
            {event.coach_avatar ? (
              <img src={event.coach_avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-display text-primary">{event.coach_name?.charAt(0)}</span>
              </div>
            )}
            <span className="font-body text-xs text-muted-foreground">{event.coach_name}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
              <Calendar size={12} />
              <span>{format(new Date(event.start_datetime), "EEE, d MMM · HH:mm")} – {format(new Date(event.end_datetime), "HH:mm")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
              <MapPin size={12} />
              <span>{event.location_city || "TBA"}{event.is_online && <span className="ml-1 text-primary">· Online</span>}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {event.age_group !== "all" && (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-display tracking-wider text-muted-foreground">{event.age_group.toUpperCase()}</span>
            )}
            {event.skill_level !== "all" && (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-display tracking-wider text-muted-foreground">{event.skill_level.toUpperCase()}</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              {spots !== null && spots < 5 && !isFull && (
                <p className="text-[10px] font-display text-amber-400">{spots} spots left</p>
              )}
              {isFull && <p className="text-[10px] font-display text-red-400">FULL</p>}
              <p className={`font-display text-lg ${isFree ? "text-emerald-400" : "text-foreground"}`}>
                {isFree ? "Free" : `${currencySymbol(event.currency)}${Number(event.price_per_person)}`}
              </p>
            </div>

            {isRegistered ? (
              <div className="flex flex-col items-end gap-1">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-display tracking-wider flex items-center gap-1"><CheckCircle size={10} /> REGISTERED</span>
                <button onClick={() => handleCancel(event.id)} className="text-[9px] font-body text-muted-foreground hover:text-destructive transition-colors">Cancel</button>
              </div>
            ) : isFull ? (
              <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-[10px] font-display tracking-wider">FULL</span>
            ) : (
              <button
                onClick={() => handleRegister(event)}
                disabled={registering === event.id}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {registering === event.id ? "..." : "REGISTER"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <PublicHeader />

      {/* Hero */}
      <div className="bg-card border-b border-border py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <h1 className="font-display text-3xl md:text-5xl text-foreground mb-3 relative">UPCOMING EVENTS</h1>
        <p className="font-body text-sm md:text-base text-muted-foreground max-w-2xl mx-auto relative">
          Clinics, camps and group sessions from the world's best tennis and padel coaches
        </p>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-16 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 max-w-xs w-full sm:w-auto">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search by city..."
                className="flex-1 bg-transparent font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>

            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto">
              {EVENT_TYPES.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg font-display text-[10px] tracking-wider whitespace-nowrap transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {t === "All" ? "ALL" : formatEventType(t).toUpperCase()}
                </button>
              ))}
            </div>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 font-display text-[10px] tracking-wider text-foreground">
              {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
              {SPORT_FILTERS.map(s => (
                <button key={s} onClick={() => setSportFilter(s)}
                  className={`px-2.5 py-1 rounded-lg font-display text-[10px] tracking-wider transition-colors ${sportFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
              {LEVEL_FILTERS.map(l => (
                <button key={l} onClick={() => setLevelFilter(l)}
                  className={`px-2.5 py-1 rounded-lg font-display text-[10px] tracking-wider transition-colors ${levelFilter === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
              {AGE_FILTERS.map(a => (
                <button key={a} onClick={() => setAgeFilter(a)}
                  className={`px-2.5 py-1 rounded-lg font-display text-[10px] tracking-wider transition-colors ${ageFilter === a ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {a.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-10">
        {/* Featured */}
        {featured.length > 0 && (
          <section>
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">HAPPENING SOON</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {featured.map(e => <EventCard key={e.id} event={e} large />)}
            </div>
          </section>
        )}

        {/* Main grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="font-display text-lg text-foreground">No upcoming events yet</p>
            <p className="font-body text-sm text-muted-foreground mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>

      <PublicBottomNav />
    </div>
  );
};

export default Events;
