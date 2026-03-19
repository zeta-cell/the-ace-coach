import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import PublicBottomNav from "@/components/PublicBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Search, Star, CheckCircle, Shield, Zap, Crown,
  SlidersHorizontal, X, ChevronDown, Circle, Grip, Layers, Award,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

/* ── types ── */
interface CoachCard {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location_city: string | null;
  location_country: string | null;
  badge_level: string;
  is_verified: boolean;
  years_experience: number | null;
  languages: string[];
  specializations: string[];
  hourly_rate_from: number | null;
  profile_slug: string | null;
  total_sessions_coached: number;
  coaching_style: string | null;
  avg_rating: number;
  review_count: number;
  session_types: string[];
  available_days: number[];
  primary_sport: string | null;
  cert_count: number;
}

const BADGE_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  starter: { icon: Shield, color: "bg-muted text-muted-foreground", label: "Starter" },
  pro: { icon: Star, color: "bg-blue-500/20 text-blue-400", label: "Pro" },
  elite: { icon: Zap, color: "bg-amber-500/20 text-amber-400", label: "Elite" },
  legend: { icon: Crown, color: "bg-purple-500/20 text-purple-400", label: "Legend" },
};

const LANGUAGES = ["English", "Spanish", "German", "French", "Portuguese", "Arabic", "Italian"];
const SESSION_TYPES = ["Individual", "Group", "Kids", "Online"];
const AVAILABILITY_OPTIONS = ["Any", "Weekdays", "Weekends"];
const BADGE_LEVELS = ["Any", "Pro", "Elite", "Legend"];
const RATINGS = ["Any", "3+", "4+", "4.5+"];
const EXPERIENCE = ["Any", "2+ years", "5+ years", "10+ years"];
const SORTS = [
  { key: "best", label: "BEST MATCH" },
  { key: "price", label: "PRICE ↑" },
  { key: "rating", label: "TOP RATED" },
  { key: "experience", label: "MOST EXPERIENCED" },
];

/* ── skeleton card ── */
const SkeletonCard = () => (
  <div className="bg-card border border-border rounded-2xl p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-14 h-14 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-muted rounded w-full" />
      <div className="h-3 bg-muted rounded w-3/4" />
    </div>
    <div className="flex gap-2 mt-4">
      <div className="h-8 bg-muted rounded-lg flex-1" />
      <div className="h-8 bg-muted rounded-lg flex-1" />
    </div>
  </div>
);

/* ── coach card ── */
const CoachCardComponent = ({ coach }: { coach: CoachCard }) => {
  const badge = BADGE_CONFIG[coach.badge_level] || BADGE_CONFIG.starter;
  const BadgeIcon = badge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3 mb-3">
        {coach.avatar_url ? (
          <img src={coach.avatar_url} alt={coach.full_name} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
            <span className="font-display text-xl text-primary">{coach.full_name.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-lg text-foreground truncate">{coach.full_name}</h3>
            {coach.is_verified && <CheckCircle size={16} className="text-blue-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-display tracking-wider ${badge.color}`}>
              <BadgeIcon size={10} /> {badge.label.toUpperCase()}
            </span>
            {coach.primary_sport && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-display tracking-wider text-muted-foreground">
                {coach.primary_sport === "tennis" ? <><Circle size={10} className="text-primary" /> TENNIS</> : coach.primary_sport === "padel" ? <><Grip size={10} className="text-accent-foreground" /> PADEL</> : <><Layers size={10} className="text-primary" /> BOTH</>}
              </span>
            )}
            {coach.location_city && (
              <span className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                <MapPin size={10} /> {coach.location_city}{coach.location_country ? `, ${coach.location_country}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {coach.review_count > 0 ? (
            <>
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="font-display text-sm text-foreground">{coach.avg_rating.toFixed(1)}</span>
              <span className="text-xs font-body text-muted-foreground">({coach.review_count})</span>
            </>
          ) : (
            <span className="text-xs font-body text-muted-foreground">No reviews yet</span>
          )}
        </div>
        <span className="font-display text-sm text-primary">
          {coach.hourly_rate_from ? `From €${coach.hourly_rate_from}/session` : "Contact for pricing"}
        </span>
      </div>

      {coach.languages.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {coach.languages.slice(0, 3).map((l) => (
            <span key={l} className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-body text-muted-foreground">{l}</span>
          ))}
          {coach.languages.length > 3 && (
            <span className="text-[10px] font-body text-primary">+{coach.languages.length - 3} more</span>
          )}
        </div>
      )}

      {coach.specializations.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {coach.specializations.slice(0, 3).map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-body text-muted-foreground">{s}</span>
          ))}
        </div>
      )}

      {coach.cert_count > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-body mb-4">
          <Award size={10} /> {coach.cert_count} certification{coach.cert_count > 1 ? "s" : ""}
        </span>
      )}

      <div className="flex gap-2">
        <Link
          to={coach.profile_slug ? `/coach/${coach.profile_slug}` : "#"}
          className="flex-1 text-center py-2.5 rounded-xl border border-border font-display text-xs tracking-wider text-foreground hover:bg-secondary transition-colors"
        >
          VIEW PROFILE
        </Link>
        <Link
          to="/login"
          className="flex-1 text-center py-2.5 rounded-xl bg-primary font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          BOOK NOW
        </Link>
      </div>
    </motion.div>
  );
};

/* ── filter sidebar content ── */
const FilterContent = ({
  priceRange, setPriceRange,
  selectedLanguages, toggleLanguage,
  selectedSessionTypes, toggleSessionType,
  selectedAvailability, setSelectedAvailability,
  coachingStyleSearch, setCoachingStyleSearch,
  selectedBadge, setSelectedBadge,
  selectedRating, setSelectedRating,
  selectedExperience, setSelectedExperience,
  resetFilters,
}: {
  priceRange: number[];
  setPriceRange: (v: number[]) => void;
  selectedLanguages: Set<string>;
  toggleLanguage: (l: string) => void;
  selectedSessionTypes: Set<string>;
  toggleSessionType: (t: string) => void;
  selectedAvailability: string;
  setSelectedAvailability: (a: string) => void;
  coachingStyleSearch: string;
  setCoachingStyleSearch: (s: string) => void;
  selectedBadge: string;
  setSelectedBadge: (b: string) => void;
  selectedRating: string;
  setSelectedRating: (r: string) => void;
  selectedExperience: string;
  setSelectedExperience: (e: string) => void;
  resetFilters: () => void;
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="font-display text-sm tracking-wider text-foreground">FILTERS</h2>
      <button onClick={resetFilters} className="text-xs font-body text-primary hover:underline">Reset</button>
    </div>

    {/* Price */}
    <div>
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-3">PRICE RANGE</p>
      <Slider min={0} max={500} step={5} value={priceRange} onValueChange={setPriceRange} className="mb-2" />
      <p className="text-xs font-body text-muted-foreground">€{priceRange[0]} — €{priceRange[1]}/session</p>
    </div>

    {/* Languages */}
    <div>
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-2">LANGUAGES</p>
      <div className="space-y-1.5">
        {LANGUAGES.map((l) => (
          <label key={l} className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={selectedLanguages.has(l)} onChange={() => toggleLanguage(l)} className="w-3.5 h-3.5 rounded border-border bg-secondary accent-primary" />
            <span className="text-xs font-body text-muted-foreground group-hover:text-foreground transition-colors">{l}</span>
          </label>
        ))}
      </div>
    </div>

    {/* Session type */}
    <div>
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-2">SESSION TYPE</p>
      <div className="flex flex-wrap gap-1.5">
        {SESSION_TYPES.map((t) => (
          <button key={t} onClick={() => toggleSessionType(t)}
            className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
              selectedSessionTypes.has(t) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{t.toUpperCase()}</button>
        ))}
      </div>
    </div>

    {/* Availability */}
    <div>
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-2">AVAILABILITY</p>
      <div className="flex flex-wrap gap-1.5">
        {AVAILABILITY_OPTIONS.map((a) => (
          <button key={a} onClick={() => setSelectedAvailability(a)}
            className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
              selectedAvailability === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{a.toUpperCase()}</button>
        ))}
      </div>
    </div>

    {/* Coaching style */}
    <div>
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-2">COACHING STYLE</p>
      <input
        type="text" value={coachingStyleSearch} onChange={(e) => setCoachingStyleSearch(e.target.value)}
        placeholder="e.g. Technical, Tactical..."
        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
      />
    </div>

    {/* Badge */}
    <div>
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-2">BADGE LEVEL</p>
      <div className="flex flex-wrap gap-1.5">
        {BADGE_LEVELS.map((b) => (
          <button key={b} onClick={() => setSelectedBadge(b)}
            className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
              selectedBadge === b ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{b.toUpperCase()}</button>
        ))}
      </div>
    </div>

    {/* Rating */}
    <div>
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-2">RATING</p>
      <div className="flex flex-wrap gap-1.5">
        {RATINGS.map((r) => (
          <button key={r} onClick={() => setSelectedRating(r)}
            className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
              selectedRating === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{r}</button>
        ))}
      </div>
    </div>

    {/* Experience */}
    <div>
      <p className="font-display text-xs tracking-wider text-muted-foreground mb-2">EXPERIENCE</p>
      <div className="flex flex-wrap gap-1.5">
        {EXPERIENCE.map((e) => (
          <button key={e} onClick={() => setSelectedExperience(e)}
            className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
              selectedExperience === e ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{e.toUpperCase()}</button>
        ))}
      </div>
    </div>
  </div>
);

/* ── main page ── */
const FindACoach = () => {
  const [coaches, setCoaches] = useState<CoachCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [citySearch, setCitySearch] = useState("");
  const [sportFilter, setSportFilter] = useState<"all" | "tennis" | "padel">("all");
  const [sortBy, setSortBy] = useState("best");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<Set<string>>(new Set());
  const [selectedAvailability, setSelectedAvailability] = useState("Any");
  const [coachingStyleSearch, setCoachingStyleSearch] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("Any");
  const [selectedRating, setSelectedRating] = useState("Any");
  const [selectedExperience, setSelectedExperience] = useState("Any");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);

  const toggleLanguage = (l: string) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      next.has(l) ? next.delete(l) : next.add(l);
      return next;
    });
  };

  const toggleSessionType = (t: string) => {
    setSelectedSessionTypes((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const resetFilters = () => {
    setPriceRange([0, 500]);
    setSelectedLanguages(new Set());
    setSelectedSessionTypes(new Set());
    setSelectedAvailability("Any");
    setCoachingStyleSearch("");
    setSelectedBadge("Any");
    setSelectedRating("Any");
    setSelectedExperience("Any");
    setCitySearch("");
    setSportFilter("all");
  };

  useEffect(() => { fetchCoaches(); }, []);

  const fetchCoaches = async () => {
    setLoading(true);

    const { data: coachProfiles } = await supabase
      .from("coach_profiles")
      .select("user_id, bio, location_city, location_country, badge_level, is_verified, years_experience, languages, specializations, hourly_rate_from, profile_slug, total_sessions_coached, coaching_style, primary_sport");

    if (!coachProfiles || coachProfiles.length === 0) {
      setCoaches([]);
      setLoading(false);
      return;
    }

    const userIds = coachProfiles.map((c) => c.user_id);

    const [profilesRes, reviewsRes, packagesRes, availabilityRes, certsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
      supabase.from("reviews").select("coach_id, rating"),
      supabase.from("coach_packages").select("coach_id, session_type").eq("is_active", true).in("coach_id", userIds),
      supabase.from("coach_availability_slots").select("coach_id, day_of_week").eq("is_recurring", true).in("coach_id", userIds),
      supabase.from("coach_certifications").select("coach_id").in("coach_id", userIds),
    ]);

    const profileMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]) || []);

    const ratingMap = new Map<string, { sum: number; count: number }>();
    reviewsRes.data?.forEach((r) => {
      const existing = ratingMap.get(r.coach_id) || { sum: 0, count: 0 };
      existing.sum += r.rating;
      existing.count += 1;
      ratingMap.set(r.coach_id, existing);
    });

    const sessionTypesMap = new Map<string, string[]>();
    packagesRes.data?.forEach((p) => {
      const existing = sessionTypesMap.get(p.coach_id) || [];
      if (!existing.includes(p.session_type)) existing.push(p.session_type);
      sessionTypesMap.set(p.coach_id, existing);
    });

    const availabilityMap = new Map<string, number[]>();
    availabilityRes.data?.forEach((a) => {
      if (a.day_of_week === null) return;
      const existing = availabilityMap.get(a.coach_id) || [];
      if (!existing.includes(a.day_of_week)) existing.push(a.day_of_week);
      availabilityMap.set(a.coach_id, existing);
    });

    const certCountMap = new Map<string, number>();
    (certsRes.data || []).forEach((c: any) => {
      certCountMap.set(c.coach_id, (certCountMap.get(c.coach_id) || 0) + 1);
    });

    const result: CoachCard[] = coachProfiles.map((cp) => {
      const profile = profileMap.get(cp.user_id);
      const ratings = ratingMap.get(cp.user_id);
      return {
        user_id: cp.user_id,
        full_name: profile?.full_name || "Coach",
        avatar_url: profile?.avatar_url || null,
        bio: cp.bio,
        location_city: cp.location_city,
        location_country: cp.location_country,
        badge_level: cp.badge_level || "starter",
        is_verified: cp.is_verified || false,
        years_experience: cp.years_experience,
        languages: (cp.languages as string[]) || [],
        specializations: (cp.specializations as string[]) || [],
        hourly_rate_from: cp.hourly_rate_from ? Number(cp.hourly_rate_from) : null,
        profile_slug: cp.profile_slug,
        total_sessions_coached: cp.total_sessions_coached || 0,
        coaching_style: cp.coaching_style,
        avg_rating: ratings ? ratings.sum / ratings.count : 0,
        review_count: ratings?.count || 0,
        session_types: sessionTypesMap.get(cp.user_id) || [],
        available_days: availabilityMap.get(cp.user_id) || [],
        primary_sport: (cp as any).primary_sport || null,
        cert_count: certCountMap.get(cp.user_id) || 0,
      };
    });

    setCoaches(result);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = [...coaches];

    // City
    if (citySearch.trim()) {
      const q = citySearch.toLowerCase();
      result = result.filter((c) => c.location_city?.toLowerCase().includes(q));
    }

    // Coaching style
    if (coachingStyleSearch.trim()) {
      const q = coachingStyleSearch.toLowerCase();
      result = result.filter((c) => c.coaching_style?.toLowerCase().includes(q));
    }

    // Sport — filter by primary_sport first, then fallback to text match
    if (sportFilter !== "all") {
      result = result.filter((c) => {
        if (c.primary_sport) {
          return c.primary_sport === sportFilter || c.primary_sport === "both";
        }
        const inSpecs = c.specializations.some((s) => s.toLowerCase().includes(sportFilter));
        const inBio = c.bio?.toLowerCase().includes(sportFilter);
        const inStyle = c.coaching_style?.toLowerCase().includes(sportFilter);
        return inSpecs || inBio || inStyle;
      });
    }

    // Price
    result = result.filter((c) => {
      if (c.hourly_rate_from === null) return true;
      return c.hourly_rate_from >= priceRange[0] && c.hourly_rate_from <= priceRange[1];
    });

    // Languages
    if (selectedLanguages.size > 0) {
      result = result.filter((c) => c.languages.some((l) => selectedLanguages.has(l)));
    }

    // Session types
    if (selectedSessionTypes.size > 0) {
      result = result.filter((c) =>
        c.session_types.some((t) => selectedSessionTypes.has(t.charAt(0).toUpperCase() + t.slice(1)))
      );
    }

    // Badge
    if (selectedBadge !== "Any") {
      result = result.filter((c) => c.badge_level === selectedBadge.toLowerCase());
    }

    // Rating
    if (selectedRating !== "Any") {
      const minRating = parseFloat(selectedRating.replace("+", ""));
      result = result.filter((c) => c.avg_rating >= minRating);
    }

    // Experience
    if (selectedExperience !== "Any") {
      const minYears = parseInt(selectedExperience);
      result = result.filter((c) => (c.years_experience || 0) >= minYears);
    }

    // Availability
    if (selectedAvailability !== "Any") {
      result = result.filter((c) => {
        if (!c.available_days || c.available_days.length === 0) return true;
        if (selectedAvailability === "Weekdays") return c.available_days.some((d) => d >= 0 && d <= 4);
        if (selectedAvailability === "Weekends") return c.available_days.some((d) => d === 5 || d === 6);
        return true;
      });
    }

    // Sort
    switch (sortBy) {
      case "price":
        result.sort((a, b) => (a.hourly_rate_from ?? 9999) - (b.hourly_rate_from ?? 9999));
        break;
      case "rating":
        result.sort((a, b) => b.avg_rating - a.avg_rating);
        break;
      case "experience":
        result.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
        break;
      default:
        result.sort((a, b) => {
          if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
          if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
          return b.total_sessions_coached - a.total_sessions_coached;
        });
    }

    return result;
  }, [coaches, citySearch, coachingStyleSearch, sportFilter, priceRange, selectedLanguages, selectedSessionTypes, selectedAvailability, selectedBadge, selectedRating, selectedExperience, sortBy]);

  const filterProps = {
    priceRange, setPriceRange,
    selectedLanguages, toggleLanguage,
    selectedSessionTypes, toggleSessionType,
    selectedAvailability, setSelectedAvailability,
    coachingStyleSearch, setCoachingStyleSearch,
    selectedBadge, setSelectedBadge,
    selectedRating, setSelectedRating,
    selectedExperience, setSelectedExperience,
    resetFilters,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky nav */}
      <PublicHeader />

      {/* Filter toggle (all screens) */}
      <div className="px-4 md:px-6 py-3 border-b border-border flex items-center gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 flex-1 sm:flex-none">
          {(["all", "tennis", "padel"] as const).map((s) => (
            <button key={s} onClick={() => setSportFilter(s)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider transition-colors ${
                sportFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >{s.toUpperCase()}</button>
          ))}
        </div>
        <button onClick={() => {
          if (window.innerWidth < 768) setMobileFiltersOpen(true);
          else setDesktopFiltersOpen(prev => !prev);
        }} className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
          desktopFiltersOpen ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground hover:text-foreground"
        }`}>
          <SlidersHorizontal size={16} />
          <span className="hidden md:inline font-display text-[10px] tracking-wider">FILTERS</span>
        </button>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 z-50" onClick={() => setMobileFiltersOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-[300px] bg-card border-r border-border z-50 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display text-sm tracking-wider">FILTERS</span>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-1"><X size={18} /></button>
              </div>
              <FilterContent {...filterProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex gap-6">
        {/* Desktop collapsible filter sidebar */}
        <AnimatePresence>
          {desktopFiltersOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:block shrink-0 overflow-hidden"
            >
              <div className="w-[280px] sticky top-[80px] self-start max-h-[calc(100vh-96px)] overflow-y-auto pr-2 scrollbar-none">
                <FilterContent {...filterProps} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <p className="font-display text-sm tracking-wider text-foreground">
              {loading ? "SEARCHING..." : `${filtered.length} COACH${filtered.length !== 1 ? "ES" : ""} FOUND${citySearch ? ` IN ${citySearch.toUpperCase()}` : ""}`}
            </p>
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto">
              {SORTS.map((s) => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  className={`px-3 py-1.5 rounded-lg font-display text-[10px] tracking-wider whitespace-nowrap transition-colors ${
                    sortBy === s.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >{s.label}</button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((coach) => <CoachCardComponent key={coach.user_id} coach={coach} />)}
            </div>
          )}

          {!loading && filtered.length === 0 && citySearch && (
            <div className="text-center py-20">
              <MapPin size={40} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl text-foreground mb-2">NO COACHES FOUND IN {citySearch.toUpperCase()} YET</h3>
              <p className="font-body text-sm text-muted-foreground mb-6">Want to coach in {citySearch}? Join as a coach →</p>
              <Link to="/login" className="inline-flex items-center gap-2 font-display text-sm tracking-wider bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">JOIN AS COACH</Link>
            </div>
          )}

          {!loading && filtered.length === 0 && !citySearch && coaches.length === 0 && (
            <div className="text-center py-20">
              <Shield size={40} className="text-primary mx-auto mb-4" />
              <h3 className="font-display text-2xl text-foreground mb-2">BE THE FIRST COACH ON ACE</h3>
              <p className="font-body text-sm text-muted-foreground mb-6">Join the platform and start coaching today.</p>
              <Link to="/login" className="inline-flex items-center gap-2 font-display text-sm tracking-wider bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">JOIN AS COACH</Link>
            </div>
          )}
        </main>
      </div>
      <PublicBottomNav />
    </div>
  );
};

export default FindACoach;
