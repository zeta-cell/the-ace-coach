import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  MapPin, Clock, Star, CheckCircle2, Share2, Globe, Award,
  Users, Zap, Calendar, ArrowRight, Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer
} from "recharts";

interface CoachProfile {
  user_id: string;
  bio: string | null;
  coaching_style: string | null;
  certifications: string[];
  languages: string[];
  specializations: string[];
  years_experience: number | null;
  nationality: string | null;
  dominant_hand: string | null;
  playtomic_level: number | null;
  volley_pct: number;
  forehand_pct: number;
  serve_pct: number;
  smash_pct: number;
  backhand_pct: number;
  lob_pct: number;
  best_shot: string | null;
  weakest_shot: string | null;
  location_city: string | null;
  location_country: string | null;
  hourly_rate_from: number | null;
  profile_slug: string | null;
  is_verified: boolean;
  badge_level: string;
  total_sessions_coached: number;
  response_time_hours: number;
}

interface Package {
  id: string;
  title: string;
  session_type: string;
  sport: string;
  duration_minutes: number;
  price_per_session: number;
  currency: string;
  description: string | null;
  total_sessions: number | null;
  max_group_size: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  player_name: string;
  player_avatar: string | null;
}

interface Profile {
  full_name: string;
  avatar_url: string | null;
}

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  starter: { label: "Starter", color: "bg-secondary text-secondary-foreground", icon: Shield },
  pro: { label: "Pro", color: "bg-chart-2/20 text-chart-2", icon: Award },
  elite: { label: "Elite", color: "bg-chart-4/20 text-chart-4", icon: Zap },
  legend: { label: "Legend", color: "bg-primary/20 text-primary", icon: Star },
};

const SESSION_COLORS: Record<string, string> = {
  individual: "bg-primary/10 text-primary",
  group: "bg-chart-2/20 text-chart-2",
  kids: "bg-chart-4/20 text-chart-4",
  online: "bg-chart-3/20 text-chart-3",
};

const PublicCoachProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showStickyBook, setShowStickyBook] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowStickyBook(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (slug) fetchCoach();
  }, [slug]);

  const fetchCoach = async () => {
    setLoading(true);

    const { data: coachData, error } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("profile_slug", slug)
      .single();

    if (error || !coachData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setCoach(coachData as unknown as CoachProfile);

    const [profileRes, packagesRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url").eq("user_id", coachData.user_id).single(),
      supabase.from("coach_packages").select("*").eq("coach_id", coachData.user_id).eq("is_active", true).order("price_per_session"),
      supabase.from("reviews").select("*").eq("coach_id", coachData.user_id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (packagesRes.data) setPackages(packagesRes.data as unknown as Package[]);

    // Fetch player names for reviews
    if (reviewsRes.data && reviewsRes.data.length > 0) {
      const playerIds = [...new Set((reviewsRes.data as any[]).map((r: any) => r.player_id))];
      const { data: players } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", playerIds);

      const playerMap = new Map((players || []).map((p: any) => [p.user_id, p]));
      setReviews(
        (reviewsRes.data as any[]).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          player_name: (playerMap.get(r.player_id) as any)?.full_name || "Anonymous",
          player_avatar: (playerMap.get(r.player_id) as any)?.avatar_url || null,
        }))
      );
    }

    setLoading(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const shareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Profile URL copied to clipboard" });
  };

  const currencySymbol = (c: string) => c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : c;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !coach || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="font-display text-4xl text-foreground">COACH NOT FOUND</h1>
        <p className="font-body text-muted-foreground">This profile doesn't exist or has been removed.</p>
        <Link to="/" className="mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90 transition-colors">
          BACK TO HOME
        </Link>
      </div>
    );
  }

  const badgeCfg = BADGE_CONFIG[coach.badge_level] || BADGE_CONFIG.starter;
  const BadgeIcon = badgeCfg.icon;

  const radarData = [
    { shot: "Forehand", value: coach.forehand_pct },
    { shot: "Backhand", value: coach.backhand_pct },
    { shot: "Serve", value: coach.serve_pct },
    { shot: "Volley", value: coach.volley_pct },
    { shot: "Smash", value: coach.smash_pct },
    { shot: "Lob", value: coach.lob_pct },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-display text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            ← HOME
          </Link>
          <button
            onClick={shareProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-display tracking-wider hover:bg-secondary/80 transition-colors"
          >
            <Share2 size={14} /> SHARE PROFILE
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* 1. HERO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-secondary overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display text-5xl text-primary">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {coach.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-chart-2 rounded-full p-1.5">
                  <CheckCircle2 size={16} className="text-background" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-wide">
                  {profile.full_name.toUpperCase()}
                </h1>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-display tracking-wider ${badgeCfg.color}`}>
                  <BadgeIcon size={12} /> {badgeCfg.label.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm font-body text-muted-foreground">
                {(coach.location_city || coach.location_country) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {[coach.location_city, coach.location_country].filter(Boolean).join(", ")}
                  </span>
                )}
                {coach.years_experience != null && coach.years_experience > 0 && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {coach.years_experience}y experience
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={14} /> Responds in ~{coach.response_time_hours}h
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {coach.languages?.map((lang) => (
                  <span key={lang} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-body">
                    <Globe size={10} /> {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick price CTA */}
            {coach.hourly_rate_from != null && (
              <div className="text-center md:text-right shrink-0">
                <p className="font-body text-xs text-muted-foreground uppercase">From</p>
                <p className="font-display text-4xl text-foreground">€{Number(coach.hourly_rate_from).toFixed(0)}</p>
                <p className="font-body text-xs text-muted-foreground">/session</p>
                <Link
                  to={`/book/${coach.profile_slug}`}
                  className="inline-flex items-center gap-2 mt-3 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors"
                >
                  BOOK NOW <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </motion.section>

        {/* 2. STATS BAR */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-foreground">{coach.total_sessions_coached}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Sessions Coached</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star size={16} className="text-chart-4 fill-chart-4" />
              <p className="font-display text-2xl text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
            </div>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">{reviews.length} Reviews</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-foreground">{coach.playtomic_level || "—"}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Playtomic Level</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="font-display text-2xl text-foreground">{packages.length}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">Packages Available</p>
          </div>
        </motion.section>

        {/* Specializations */}
        {coach.specializations?.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2">
            {coach.specializations.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs font-body">{s}</Badge>
            ))}
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* 3. ABOUT */}
            {coach.bio && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">ABOUT</h2>
                <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-line">{coach.bio}</p>
                {coach.coaching_style && (
                  <p className="mt-4 font-body text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Coaching style:</span> {coach.coaching_style}
                  </p>
                )}
              </motion.section>
            )}

            {/* 4. PACKAGES */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">PACKAGES & PRICING</h2>
              {packages.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <p className="font-body text-sm text-muted-foreground">No packages available yet.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className="group hover:border-primary/50 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${SESSION_COLORS[pkg.session_type] || "bg-secondary text-foreground"}`}>
                            {pkg.session_type}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-semibold uppercase">
                            {pkg.sport}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-semibold">
                            {pkg.duration_minutes}min
                          </span>
                        </div>
                        <h3 className="font-display text-base tracking-wider text-foreground mb-1">{pkg.title.toUpperCase()}</h3>
                        {pkg.description && (
                          <p className="font-body text-xs text-muted-foreground mb-3 line-clamp-2">{pkg.description}</p>
                        )}
                        <div className="flex items-end justify-between pt-3 border-t border-border">
                          <div>
                            <span className="font-display text-2xl text-foreground">
                              {currencySymbol(pkg.currency)}{Number(pkg.price_per_session).toFixed(0)}
                            </span>
                            <span className="font-body text-xs text-muted-foreground ml-1">/session</span>
                            {pkg.total_sessions && (
                              <p className="font-body text-[10px] text-muted-foreground">{pkg.total_sessions} sessions total</p>
                            )}
                            {pkg.max_group_size && (
                              <p className="font-body text-[10px] text-muted-foreground flex items-center gap-1">
                                <Users size={10} /> Max {pkg.max_group_size}
                              </p>
                            )}
                          </div>
                          <Link
                            to={`/book/${coach.profile_slug}`}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display tracking-wider hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            BOOK
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.section>

            {/* 6. REVIEWS */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">
                REVIEWS {reviews.length > 0 && `(${reviews.length})`}
              </h2>
              {reviews.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <p className="font-body text-sm text-muted-foreground">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                            {review.player_avatar ? (
                              <img src={review.player_avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-display text-sm text-primary">{review.player_name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-body text-sm font-medium text-foreground">{review.player_name}</p>
                            <p className="font-body text-[10px] text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={s <= review.rating ? "text-chart-4 fill-chart-4" : "text-muted-foreground/30"}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="font-body text-sm text-foreground/80 mt-2">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* 5. SHOT STATS RADAR */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-2">SHOT PROFILE</h2>
              <div className="w-full aspect-square">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="shot"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "Space Grotesk" }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Shots"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            {/* 7. CERTIFICATIONS */}
            {coach.certifications?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Award size={14} /> CERTIFICATIONS
                </h2>
                <div className="space-y-2">
                  {coach.certifications.map((cert) => (
                    <div key={cert} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
                      <CheckCircle2 size={14} className="text-chart-2 shrink-0" />
                      <span className="font-body text-sm text-foreground">{cert}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Book CTA sticky on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="sticky top-20"
            >
              <Link
                to={`/book/${coach.profile_slug}`}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-widest hover:bg-primary/90 transition-colors"
              >
                BOOK A SESSION <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
      {showStickyBook && coach.profile_slug && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            to={`/book/${coach.profile_slug}`}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-display text-xs tracking-wider shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            BOOK A SESSION →
          </Link>
        </div>
      )}
    </div>
  );
};

export default PublicCoachProfile;
