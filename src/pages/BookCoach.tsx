// TODO: Replace mock payment with Stripe checkout when keys are available
// See supabase/functions/create-checkout/index.ts (to be created)

import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, Star, Shield, Award, Zap, CheckCircle2, AlertTriangle, Calendar as CalendarIcon, User, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, getDay } from "date-fns";
import { toast } from "sonner";

interface CoachData {
  user_id: string;
  profile_slug: string | null;
  is_verified: boolean;
  badge_level: string;
  location_city: string | null;
  location_country: string | null;
}

interface ProfileData {
  full_name: string;
  avatar_url: string | null;
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
  max_group_size?: number | null;
  pricing_type?: string | null;
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean | null;
  specific_date: string | null;
  is_blocked: boolean | null;
}

const SESSION_COLORS: Record<string, string> = {
  individual: "bg-primary/10 text-primary",
  group: "bg-chart-2/20 text-chart-2",
  kids: "bg-chart-4/20 text-chart-4",
  online: "bg-chart-3/20 text-chart-3",
};

const BADGE_LABELS: Record<string, string> = {
  starter: "Starter", pro: "Pro", elite: "Elite", legend: "Legend",
};

const BookCoach = () => {
  const { coachSlug } = useParams<{ coachSlug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // Step 1
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // Step 2
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  // Group spots
  const [groupSpotsTaken, setGroupSpotsTaken] = useState(0);
  const [groupSpotsLoading, setGroupSpotsLoading] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  // Step 3
  const [notes, setNotes] = useState("");
  const [locationType, setLocationType] = useState<"in_person" | "online">("in_person");
  const [locationAddress, setLocationAddress] = useState("");
  const [confirming, setConfirming] = useState(false);

  const isGroupPackage = selectedPackage?.session_type === "group" && (selectedPackage?.max_group_size || 0) > 1;
  const spotsTotal = selectedPackage?.max_group_size || 0;
  const spotsLeft = spotsTotal - groupSpotsTaken;

  useEffect(() => {
    if (coachSlug) fetchCoachData();
  }, [coachSlug]);

  useEffect(() => {
    if (selectedDate && coach) fetchBookedTimes();
  }, [selectedDate, coach]);

  // Fetch group spots when date or package changes
  useEffect(() => {
    if (selectedDate && selectedPackage && isGroupPackage) {
      fetchGroupSpots();
    }
  }, [selectedDate, selectedPackage]);

  // Auto-select package from URL params
  useEffect(() => {
    const pkgParam = searchParams.get("package");
    const dateParam = searchParams.get("date");
    if (pkgParam && packages.length > 0) {
      const pkg = packages.find(p => p.id === pkgParam);
      if (pkg) {
        setSelectedPackage(pkg);
        setStep(2);
      }
    }
    if (dateParam) {
      setSelectedDate(new Date(dateParam + "T00:00:00"));
    }
  }, [packages, searchParams]);

  const fetchCoachData = async () => {
    setLoading(true);
    const { data: coachData } = await supabase
      .from("coach_profiles")
      .select("user_id, profile_slug, is_verified, badge_level, location_city, location_country")
      .eq("profile_slug", coachSlug)
      .single();

    if (!coachData) { navigate("/find-a-coach"); return; }
    setCoach(coachData as unknown as CoachData);

    const [profileRes, packagesRes, slotsRes, reviewsRes] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url").eq("user_id", coachData.user_id).single(),
      supabase.from("coach_packages").select("id, title, session_type, sport, duration_minutes, price_per_session, currency, description, max_group_size, pricing_type").eq("coach_id", coachData.user_id).eq("is_active", true).order("price_per_session"),
      supabase.from("coach_availability_slots").select("*").eq("coach_id", coachData.user_id),
      supabase.from("reviews").select("rating").eq("coach_id", coachData.user_id),
    ]);

    if (profileRes.data) setProfile(profileRes.data as ProfileData);
    if (packagesRes.data) setPackages(packagesRes.data as unknown as Package[]);
    if (slotsRes.data) setSlots(slotsRes.data as unknown as AvailabilitySlot[]);
    if (reviewsRes.data && reviewsRes.data.length > 0) {
      setAvgRating(reviewsRes.data.reduce((s, r) => s + r.rating, 0) / reviewsRes.data.length);
      setReviewCount(reviewsRes.data.length);
    }
    setLoading(false);
  };

  const fetchBookedTimes = async () => {
    if (!selectedDate || !coach) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("start_time")
      .eq("coach_id", coach.user_id)
      .eq("booking_date", dateStr)
      .in("status", ["pending", "confirmed"]);
    setBookedTimes((data || []).map(b => b.start_time));
  };

  const fetchGroupSpots = async () => {
    if (!selectedDate || !selectedPackage) return;
    setGroupSpotsLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("package_id", selectedPackage.id)
      .eq("booking_date", dateStr)
      .in("status", ["confirmed", "pending"]);
    setGroupSpotsTaken(count || 0);
    setGroupSpotsLoading(false);
  };

  const handleJoinWaitlist = async () => {
    if (!user || !coach || !selectedPackage || !selectedDate) return;
    setJoiningWaitlist(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { error } = await supabase.from("booking_waitlist").insert({
      player_id: user.id,
      coach_id: coach.user_id,
      package_id: selectedPackage.id,
      requested_date: dateStr,
      status: "waiting",
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already on the waitlist for this session");
      } else {
        toast.error("Failed to join waitlist");
      }
      setJoiningWaitlist(false);
      return;
    }

    // Notify coach
    await supabase.from("notifications").insert({
      user_id: coach.user_id,
      title: "New waitlist entry",
      body: `A player joined the waitlist for your group session on ${format(selectedDate, "d MMM")}`,
      link: "/coach",
    });

    toast.success("You're on the waitlist! We'll notify you if a spot opens.");
    setJoiningWaitlist(false);
  };

  const getAvailableTimesForDate = (date: Date): string[] => {
    const dow = getDay(date); // 0=Sun
    const dateStr = format(date, "yyyy-MM-dd");

    const matchingSlots = slots.filter(s => {
      if (s.is_blocked) return false;
      if (s.specific_date === dateStr) return true;
      if (s.is_recurring && s.day_of_week === dow) return true;
      return false;
    });

    const times: string[] = [];
    matchingSlots.forEach(slot => {
      const startHour = parseInt(slot.start_time.split(":")[0]);
      const endHour = parseInt(slot.end_time.split(":")[0]);
      for (let h = startHour; h < endHour; h++) {
        const timeStr = `${h.toString().padStart(2, "0")}:00:00`;
        if (!bookedTimes.includes(timeStr)) {
          times.push(timeStr);
        }
      }
    });

    return [...new Set(times)].sort();
  };

  const hasAvailability = (date: Date): boolean => {
    const dow = getDay(date);
    const dateStr = format(date, "yyyy-MM-dd");
    return slots.some(s => {
      if (s.is_blocked) return false;
      if (s.specific_date === dateStr) return true;
      if (s.is_recurring && s.day_of_week === dow) return true;
      return false;
    });
  };

  const getDisplayPrice = () => {
    if (!selectedPackage) return 0;
    if (isGroupPackage && selectedPackage.pricing_type === "fixed_total") {
      const participants = groupSpotsTaken + 1;
      return Number(selectedPackage.price_per_session) / participants;
    }
    return Number(selectedPackage.price_per_session);
  };

  const handleConfirmBooking = async () => {
    if (!user || !coach || !selectedPackage || !selectedDate || !selectedTime) return;
    setConfirming(true);

    const totalPrice = getDisplayPrice();
    const platformFee = +(totalPrice * 0.15).toFixed(2);
    const coachPayout = +(totalPrice - platformFee).toFixed(2);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const endHour = parseInt(selectedTime.split(":")[0]) + Math.ceil(selectedPackage.duration_minutes / 60);
    const endTimeStr = `${endHour.toString().padStart(2, "0")}:00:00`;

    // Check auto-confirm
    let initialStatus = "confirmed"; // default for test mode
    const { data: pkg } = await supabase
      .from("coach_packages")
      .select("auto_confirm")
      .eq("id", selectedPackage.id)
      .single();

    if (pkg?.auto_confirm) {
      const { data: slot } = await supabase
        .from("coach_availability_slots")
        .select("id")
        .eq("coach_id", coach.user_id)
        .eq("day_of_week", selectedDate.getDay())
        .maybeSingle();
      if (slot) {
        initialStatus = "confirmed";
      }
    }

    // Insert booking
    const { data: booking, error } = await supabase.from("bookings").insert({
      player_id: user.id,
      coach_id: coach.user_id,
      package_id: selectedPackage.id,
      booking_date: dateStr,
      start_time: selectedTime,
      end_time: endTimeStr,
      status: initialStatus,
      total_price: totalPrice,
      currency: selectedPackage.currency,
      platform_fee: platformFee,
      coach_payout: coachPayout,
      stripe_payment_intent_id: "test_" + crypto.randomUUID(),
      notes: notes.trim() || null,
      location_type: locationType,
      location_address: locationType === "in_person" ? locationAddress.trim() || null : null,
    }).select("id").single();

    if (error || !booking) {
      toast.error("Failed to create booking", { description: error?.message });
      setConfirming(false);
      return;
    }

    // If auto-confirmed, notify coach informally
    if (pkg?.auto_confirm && initialStatus === "confirmed") {
      await supabase.from("notifications").insert({
        user_id: coach.user_id,
        title: "New booking auto-confirmed",
        body: `A session was automatically confirmed for ${format(selectedDate, "d MMM")}`,
        link: "/coach",
      });
    }

    // Insert payment record
    await supabase.from("payments").insert({
      user_id: user.id,
      amount: totalPrice,
      currency: selectedPackage.currency,
      status: "completed",
      type: "session",
      description: `Coaching session with ${profile?.full_name} on ${dateStr}`,
    });

    // Award XP for booking
    await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: 50,
      p_event_type: 'session_booked',
      p_description: 'Booked a coaching session',
    });

    // Increment raffle tickets for booking
    await supabase.rpc('increment_raffle_tickets', { p_user_id: user.id });

    // Increment session stats
    await supabase.rpc('increment_session_stats', {
      p_user_id: user.id,
      p_minutes: selectedPackage.duration_minutes,
    });

    // Check if this is user's first booking and they were referred
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', user.id)
      .eq('status', 'confirmed');

    if (bookingCount === 1) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id')
        .eq('referred_id', user.id)
        .eq('status', 'signed_up')
        .eq('booking_reward_paid', false)
        .maybeSingle();

      if (referral) {
        await supabase.rpc('credit_wallet', {
          p_user_id: referral.referrer_id,
          p_amount: 10,
          p_type: 'credit_referral',
          p_description: 'Referred friend completed first booking',
          p_reference_id: booking.id,
        });
        await supabase.rpc('award_xp', {
          p_user_id: referral.referrer_id,
          p_amount: 150,
          p_event_type: 'referral_booking',
          p_description: 'Your referred friend booked their first session',
        });
        await supabase.from('referrals')
          .update({ booking_reward_paid: true, status: 'completed' })
          .eq('id', referral.id);
        await supabase.from('notifications').insert({
          user_id: referral.referrer_id,
          title: 'Referral reward unlocked!',
          body: 'Your referred friend booked their first session. You earned €10 wallet credit!',
          link: '/dashboard',
        });
      }
    }

    // Notifications
    await Promise.all([
      supabase.from("notifications").insert({
        user_id: user.id,
        title: "Booking confirmed!",
        body: `Your session with ${profile?.full_name} on ${format(selectedDate, "d MMM yyyy")} is confirmed.`,
        link: "/dashboard",
      }),
      supabase.from("notifications").insert({
        user_id: coach.user_id,
        title: "New booking!",
        body: `A player booked a session on ${format(selectedDate, "d MMM yyyy")}.`,
        link: "/coach",
      }),
    ]);

    // If group booking, check waitlist and notify next person if spot was taken by non-waitlist user
    // (waitlist notifications happen on cancellation, not on new booking)

    setConfirming(false);
    navigate(`/booking-success?booking_id=${booking.id}`);
  };

  const currencySymbol = (c: string) => c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : c;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!coach || !profile) return null;

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-2 font-display text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> {step > 1 ? "BACK" : "CANCEL"}
          </button>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`w-8 h-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Coach mini card */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-xl text-primary">{profile.full_name.charAt(0)}</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg text-foreground">{profile.full_name.toUpperCase()}</h2>
              {coach.is_verified && <CheckCircle2 size={14} className="text-chart-2" />}
              <span className="text-[10px] font-display tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{BADGE_LABELS[coach.badge_level] || "Starter"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
              {(coach.location_city || coach.location_country) && (
                <span className="flex items-center gap-1"><MapPin size={10} />{[coach.location_city, coach.location_country].filter(Boolean).join(", ")}</span>
              )}
              {reviewCount > 0 && (
                <span className="flex items-center gap-1"><Star size={10} className="text-chart-4 fill-chart-4" />{avgRating.toFixed(1)} ({reviewCount})</span>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 — Select Package */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="font-display text-2xl text-foreground mb-4">SELECT PACKAGE</h1>
              {packages.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                  <p className="font-body text-sm text-muted-foreground">This coach has no packages available yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {packages.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full text-left bg-card border rounded-xl p-4 transition-colors ${selectedPackage?.id === pkg.id ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${SESSION_COLORS[pkg.session_type] || "bg-secondary text-foreground"}`}>{pkg.session_type}</span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-semibold uppercase">{pkg.sport}</span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-semibold">{pkg.duration_minutes}min</span>
                            {pkg.session_type === "group" && pkg.max_group_size && (
                              <span className="px-2 py-0.5 rounded-full bg-chart-2/10 text-chart-2 text-[10px] font-semibold flex items-center gap-0.5">
                                <Users size={9} /> Max {pkg.max_group_size}
                              </span>
                            )}
                          </div>
                          <h3 className="font-display text-foreground tracking-wider">{pkg.title.toUpperCase()}</h3>
                          {pkg.description && <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-2">{pkg.description}</p>}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className="font-display text-2xl text-foreground">{currencySymbol(pkg.currency)}{Number(pkg.price_per_session).toFixed(0)}</span>
                          <p className="font-body text-[10px] text-muted-foreground">
                            {pkg.pricing_type === "fixed_total" ? "/total" : "/session"}
                          </p>
                        </div>
                      </div>
                      {selectedPackage?.id === pkg.id && (
                        <div className="mt-2 flex items-center gap-1 text-primary text-xs font-body"><Check size={14} /> Selected</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setStep(2)}
                disabled={!selectedPackage}
                className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                CONTINUE <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2 — Pick Date & Time */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="font-display text-2xl text-foreground mb-1">PICK DATE & TIME</h1>
              {selectedPackage && (
                <p className="font-body text-xs text-muted-foreground mb-4">{selectedPackage.title} · {selectedPackage.duration_minutes}min · {currencySymbol(selectedPackage.currency)}{Number(selectedPackage.price_per_session).toFixed(0)}</p>
              )}

              <div className="bg-card border border-border rounded-xl p-4 mb-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 60) || !hasAvailability(date)}
                  className="mx-auto pointer-events-auto"
                />
              </div>

              {/* Group spots display */}
              {selectedDate && isGroupPackage && (
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-chart-2" />
                    <span className="font-display text-sm tracking-wider text-foreground">GROUP SESSION</span>
                  </div>
                  {groupSpotsLoading ? (
                    <div className="flex gap-1.5">
                      {Array.from({ length: spotsTotal }).map((_, i) => (
                        <div key={i} className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 mb-2">
                        {Array.from({ length: spotsTotal }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-5 h-5 rounded-full transition-colors ${
                              i < groupSpotsTaken ? "bg-primary" : "bg-muted border border-border"
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-body text-xs text-muted-foreground">
                          {groupSpotsTaken} of {spotsTotal} spots taken
                        </span>
                      </div>
                      {spotsLeft === 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xs tracking-wider text-destructive bg-destructive/10 px-3 py-1 rounded-full">SESSION FULL</span>
                        </div>
                      ) : spotsLeft <= 2 ? (
                        <p className="font-body text-xs text-chart-4">Only {spotsLeft} spot{spotsLeft > 1 ? "s" : ""} left!</p>
                      ) : (
                        <p className="font-body text-xs text-muted-foreground">{spotsLeft} spots available</p>
                      )}

                      {/* Pricing for fixed_total */}
                      {selectedPackage?.pricing_type === "fixed_total" && spotsLeft > 0 && (
                        <p className="font-body text-xs text-muted-foreground mt-2">
                          Your share: {currencySymbol(selectedPackage.currency)}{getDisplayPrice().toFixed(0)} (total {currencySymbol(selectedPackage.currency)}{Number(selectedPackage.price_per_session).toFixed(0)} split between {groupSpotsTaken + 1} players)
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {selectedDate && (
                <div className="mb-4">
                  <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-2">AVAILABLE TIMES — {format(selectedDate, "EEE d MMM")}</h3>
                  {availableTimes.length === 0 ? (
                    <p className="font-body text-xs text-muted-foreground">No available slots for this date.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableTimes.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`px-4 py-2 rounded-lg font-body text-sm transition-colors ${selectedTime === time ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:border-primary/40"}`}
                        >
                          {time.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Waitlist button for full group sessions */}
              {selectedDate && isGroupPackage && spotsLeft === 0 ? (
                <button
                  onClick={handleJoinWaitlist}
                  disabled={joiningWaitlist}
                  className="w-full mt-4 py-3 rounded-xl bg-chart-4 text-chart-4-foreground font-display tracking-wider hover:bg-chart-4/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {joiningWaitlist ? "JOINING..." : "JOIN WAITLIST"}
                </button>
              ) : (
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  CONTINUE <ArrowRight size={16} />
                </button>
              )}
            </motion.div>
          )}

          {/* STEP 3 — Confirm & Pay */}
          {step === 3 && selectedPackage && selectedDate && selectedTime && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="font-display text-2xl text-foreground mb-4">CONFIRM BOOKING</h1>

              {/* Test mode banner */}
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-4">
                <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
                <p className="font-body text-xs text-yellow-400">TEST MODE — No real payment will be taken</p>
              </div>

              {/* Summary card */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-primary">{profile.full_name.charAt(0)}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-display text-foreground">{profile.full_name.toUpperCase()}</p>
                    <p className="font-body text-xs text-muted-foreground">{coach.is_verified ? "Verified Coach" : "Coach"}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Package</span>
                    <span className="text-foreground">{selectedPackage.title}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Type</span>
                    <span className="text-foreground capitalize">{selectedPackage.session_type} · {selectedPackage.sport}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{format(selectedDate, "EEE, d MMM yyyy")}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Time</span>
                    <span className="text-foreground">{selectedTime.slice(0, 5)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground">{selectedPackage.duration_minutes} minutes</span>
                  </div>
                  {isGroupPackage && (
                    <div className="flex justify-between text-sm font-body">
                      <span className="text-muted-foreground">Group spots</span>
                      <span className="text-foreground">{groupSpotsTaken + 1} / {spotsTotal}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-body text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-2xl text-foreground">{currencySymbol(selectedPackage.currency)}{getDisplayPrice().toFixed(2)}</span>
                </div>
                {isGroupPackage && selectedPackage.pricing_type === "fixed_total" && (
                  <p className="font-body text-[10px] text-muted-foreground">
                    Total {currencySymbol(selectedPackage.currency)}{Number(selectedPackage.price_per_session).toFixed(0)} split between {groupSpotsTaken + 1} players
                  </p>
                )}
                <p className="font-body text-[10px] text-muted-foreground">Secure payment via Stripe</p>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-xs font-body text-muted-foreground mb-1 block">Any notes for your coach? (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. I want to work on my backhand..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none"
                />
              </div>

              {/* Location type */}
              <div className="mb-4">
                <label className="text-xs font-body text-muted-foreground mb-2 block">Location</label>
                <div className="flex gap-2">
                  {(["in_person", "online"] as const).map(lt => (
                    <button
                      key={lt}
                      onClick={() => setLocationType(lt)}
                      className={`flex-1 py-2 rounded-lg font-display text-xs tracking-wider transition-colors ${locationType === lt ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {lt === "in_person" ? "IN PERSON" : "ONLINE"}
                    </button>
                  ))}
                </div>
                {locationType === "in_person" && (
                  <input
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Training venue address..."
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  />
                )}
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={confirming}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {confirming ? "CONFIRMING..." : "CONFIRM BOOKING (TEST MODE)"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookCoach;
