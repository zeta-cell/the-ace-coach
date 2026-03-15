import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  X, Star, Clock, Users, CheckCircle, ChevronRight, ChevronDown,
  Heart, Award, MapPin, Play, Send, ExternalLink, Search, ArrowLeft,
  CalendarDays, UserPlus, BookOpen, Zap,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MarketplaceBlock {
  id: string; title: string; description: string | null; category: string;
  sport: string; duration_minutes: number; difficulty: string; goals: string[];
  exercises: any[]; is_for_sale: boolean; price: number; currency: string;
  block_type: string; week_count: number; times_used: number; rating_avg: number;
  rating_count: number; tags: string[]; thumbnail_url: string | null;
  preview_exercises: any; weekly_structure: any; target_level: string | null;
  target_sport: string; author_id: string | null; author_name: string | null;
  author_avatar_url: string | null; coach_id: string | null;
  [key: string]: any;
}

interface BlockRating {
  id: string; rating: number; review_text: string | null; rated_at: string;
  rated_by: string; reviewer_name?: string; reviewer_avatar?: string | null;
}

interface CoachOption {
  user_id: string; full_name: string; avatar_url: string | null;
  badge_level: string; is_verified: boolean; bio: string | null;
  location_city: string | null; languages: string[]; hourly_rate_from: number | null;
  response_time_hours: number; profile_slug: string | null;
  avg_rating: number; review_count: number;
}

interface CoachPackage {
  id: string; title: string; session_type: string; duration_minutes: number;
  price_per_session: number; currency: string; sport: string;
}

interface Props {
  block: MarketplaceBlock | null; onClose: () => void; isOwned: boolean;
  onGetProgram: (block: MarketplaceBlock) => void;
  onToggleSave: (block: MarketplaceBlock) => void; isSaved: boolean;
}

const BlockDetailDrawer = ({ block, onClose, isOwned, onGetProgram, onToggleSave, isSaved }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "structure" | "reviews" | "coach">("overview");
  const [ratings, setRatings] = useState<BlockRating[]>([]);
  const [coachOtherBlocks, setCoachOtherBlocks] = useState<any[]>([]);
  const [coachProfile, setCoachProfile] = useState<CoachOption | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  // 3-step coach assignment
  const [assignStep, setAssignStep] = useState<0 | 1 | 2 | 3>(0); // 0=hidden
  const [selectedCoach, setSelectedCoach] = useState<CoachOption | null>(null);
  const [coachSearch, setCoachSearch] = useState("");
  const [allCoaches, setAllCoaches] = useState<CoachOption[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [coachPackages, setCoachPackages] = useState<CoachPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<"guide_program" | "book_session" | "full_coaching">("guide_program");
  const [proposedDate, setProposedDate] = useState<Date | undefined>(undefined);
  const [proposedSessions, setProposedSessions] = useState(1);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (block) {
      setTab("overview");
      setAssignStep(0);
      fetchRatings();
      if (block.author_id) fetchCoachInfo();
    }
  }, [block?.id]);

  const fetchRatings = async () => {
    if (!block) return;
    const { data } = await supabase.from("block_ratings").select("*").eq("block_id", block.id).order("rated_at", { ascending: false });
    if (data && data.length > 0) {
      const userIds = data.map((r) => r.rated_by);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      setRatings(data.map((r) => ({ ...r, reviewer_name: profileMap.get(r.rated_by)?.full_name || "Anonymous", reviewer_avatar: profileMap.get(r.rated_by)?.avatar_url })));
    } else { setRatings([]); }
  };

  const fetchCoachInfo = async () => {
    if (!block?.author_id) return;
    const [profileRes, coachRes, blocksRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", block.author_id).single(),
      supabase.from("coach_profiles").select("*").eq("user_id", block.author_id).single(),
      supabase.from("training_blocks").select("*").eq("is_public", true).eq("coach_id", block.author_id).neq("id", block.id).limit(3),
    ]);
    const p = profileRes.data; const c = coachRes.data;
    if (p && c) {
      setCoachProfile({
        user_id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url,
        badge_level: c.badge_level, is_verified: c.is_verified, bio: c.bio,
        location_city: c.location_city, languages: c.languages || [],
        hourly_rate_from: c.hourly_rate_from, response_time_hours: c.response_time_hours,
        profile_slug: c.profile_slug, avg_rating: 0, review_count: 0,
      });
    }
    setCoachOtherBlocks(blocksRes.data || []);
  };

  const fetchAllCoaches = async () => {
    setLoadingCoaches(true);
    const { data: coaches } = await supabase.from("coach_profiles").select("user_id, badge_level, is_verified, bio, location_city, languages, hourly_rate_from, response_time_hours, profile_slug");
    if (!coaches) { setLoadingCoaches(false); return; }
    const uids = coaches.map((c) => c.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", uids);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    setAllCoaches(coaches.map((c) => ({
      ...c, full_name: profileMap.get(c.user_id)?.full_name || "", avatar_url: profileMap.get(c.user_id)?.avatar_url || null,
      avg_rating: 0, review_count: 0,
    })));
    setLoadingCoaches(false);
  };

  const selectCoach = async (coach: CoachOption) => {
    setSelectedCoach(coach);
    // fetch packages
    const { data } = await supabase.from("coach_packages").select("*").eq("coach_id", coach.user_id).eq("is_active", true);
    setCoachPackages((data as any as CoachPackage[]) || []);
    // pre-fill message
    const name = coach.full_name.split(" ")[0];
    if (requestType === "guide_program") {
      setRequestMessage(`Hi ${name}, I've purchased "${block?.title}" and would love your guidance executing it.`);
    } else if (requestType === "book_session") {
      setRequestMessage(`Hi ${name}, I'd like to book sessions alongside the "${block?.title}" program.`);
    } else {
      setRequestMessage(`Hi ${name}, I'm looking for a full-time coach and just bought "${block?.title}" to show the kind of training I want.`);
    }
    setAssignStep(2);
  };

  const handleSubmitReview = async () => {
    if (!user || !block) return;
    setSubmittingReview(true);
    await supabase.from("block_ratings").upsert({ block_id: block.id, rated_by: user.id, rating: reviewRating, review_text: reviewText.trim() || null } as any, { onConflict: "block_id,rated_by" });
    await supabase.rpc("update_block_rating_avg", { p_block_id: block.id });
    toast.success("Review submitted!"); setReviewText(""); fetchRatings(); setSubmittingReview(false);
  };

  const handleSendRequest = async () => {
    if (!user || !selectedCoach || !block) return;
    setSendingRequest(true);
    await supabase.from("coach_requests").insert({
      player_id: user.id, coach_id: selectedCoach.user_id, block_id: block.id,
      request_type: requestType, message: requestMessage,
      package_id: selectedPackage || null,
      proposed_start_date: proposedDate ? format(proposedDate, "yyyy-MM-dd") : null,
      proposed_sessions: requestType === "book_session" ? proposedSessions : 1,
    } as any);
    setSendingRequest(false);
    setAssignStep(3);
  };

  const toggleWeek = (w: number) => {
    setExpandedWeeks((prev) => { const n = new Set(prev); n.has(w) ? n.delete(w) : n.add(w); return n; });
  };

  const openAssignFlow = () => {
    setAssignStep(1);
    if (allCoaches.length === 0) fetchAllCoaches();
  };

  if (!block) return null;
  const weeklyStructure = block.weekly_structure as any[] | null;
  const previewExercises = block.preview_exercises as any[] | null;
  const exercises = block.exercises as any[] | null;

  const REQUEST_TYPES = [
    { key: "guide_program" as const, label: "GUIDE MY PROGRAM", sub: "Coach gets full access to your weekly schedule" },
    { key: "book_session" as const, label: "BOOK SESSIONS ALONGSIDE", sub: "Add 1:1 sessions to complement the program" },
    { key: "full_coaching" as const, label: "FULL COACHING", sub: "Coach customises and leads everything" },
  ];

  // Filter coaches in browse
  const filteredCoaches = allCoaches.filter((c) =>
    !coachSearch.trim() || c.full_name.toLowerCase().includes(coachSearch.toLowerCase())
  );

  return (
    <Sheet open={!!block} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full max-w-lg p-0 bg-card border-l border-border overflow-y-auto">
        {/* ASSIGN COACH 3-STEP FLOW */}
        {assignStep > 0 ? (
          <div className="flex flex-col h-full">
            {/* Step header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              {assignStep < 3 && (
                <button onClick={() => setAssignStep(assignStep === 1 ? 0 : assignStep === 2 ? 1 : 0 as any)} className="p-1.5 rounded-lg hover:bg-secondary"><ArrowLeft size={16} /></button>
              )}
              <h3 className="font-display text-sm text-foreground flex-1">
                {assignStep === 1 ? "CHOOSE A COACH" : assignStep === 2 ? "CONFIGURE REQUEST" : "REQUEST SENT!"}
              </h3>
              <button onClick={() => setAssignStep(0)}><X size={16} className="text-muted-foreground" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* STEP 1 — Choose coach */}
              {assignStep === 1 && (
                <>
                  {/* Option A — Author */}
                  {coachProfile && (
                    <div className="border border-border rounded-xl p-4 space-y-3">
                      <p className="font-display text-[10px] tracking-wider text-muted-foreground">THE PROGRAM AUTHOR</p>
                      <div className="flex items-center gap-3">
                        {coachProfile.avatar_url ? <img src={coachProfile.avatar_url} className="w-12 h-12 rounded-full border-2 border-border" /> : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display">{coachProfile.full_name?.charAt(0)}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-display text-sm text-foreground truncate">{coachProfile.full_name}</p>
                            {coachProfile.is_verified && <CheckCircle size={12} className="text-blue-400 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-body text-muted-foreground">
                            <span className="capitalize">{coachProfile.badge_level}</span>
                            {coachProfile.location_city && <><span>·</span><span>{coachProfile.location_city}</span></>}
                            {coachProfile.hourly_rate_from && <><span>·</span><span className="text-primary">From €{coachProfile.hourly_rate_from}/session</span></>}
                          </div>
                        </div>
                      </div>
                      {coachProfile.bio && <p className="text-xs font-body text-muted-foreground line-clamp-2">{coachProfile.bio}</p>}
                      <button onClick={() => selectCoach(coachProfile)}
                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:bg-primary/90 transition-colors">
                        SELECT THIS COACH
                      </button>
                    </div>
                  )}

                  {/* Option B — Browse */}
                  <div className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center"><Search size={20} className="text-muted-foreground" /></div>
                      <div>
                        <p className="font-display text-xs text-foreground">FIND ANY COACH</p>
                        <p className="text-[10px] font-body text-muted-foreground">Any coach gets instant access to this program's full structure</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                      <Search size={14} className="text-muted-foreground shrink-0" />
                      <input value={coachSearch} onChange={(e) => setCoachSearch(e.target.value)}
                        placeholder="Search coaches..." className="flex-1 bg-transparent text-sm font-body text-foreground focus:outline-none" />
                    </div>
                    {loadingCoaches ? (
                      <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-1.5">
                        {filteredCoaches.map((c) => (
                          <div key={c.user_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors">
                            {c.avatar_url ? <img src={c.avatar_url} className="w-9 h-9 rounded-full border border-border" /> : (
                              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xs">{c.full_name?.charAt(0)}</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-body text-foreground truncate">{c.full_name}</span>
                                {c.is_verified && <CheckCircle size={10} className="text-blue-400 shrink-0" />}
                              </div>
                              <span className="text-[9px] font-body text-muted-foreground capitalize">{c.badge_level}{c.hourly_rate_from ? ` · €${c.hourly_rate_from}` : ""}</span>
                            </div>
                            <button onClick={() => selectCoach(c)}
                              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-[9px] tracking-wider shrink-0">
                              SELECT
                            </button>
                          </div>
                        ))}
                        {filteredCoaches.length === 0 && <p className="text-xs font-body text-muted-foreground text-center py-4">No coaches found</p>}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* STEP 2 — Configure */}
              {assignStep === 2 && selectedCoach && (
                <>
                  {/* Selected coach */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                    {selectedCoach.avatar_url ? <img src={selectedCoach.avatar_url} className="w-10 h-10 rounded-full border border-border" /> : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">{selectedCoach.full_name?.charAt(0)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body text-foreground truncate">{selectedCoach.full_name}</p>
                      <p className="text-[9px] font-body text-muted-foreground capitalize">{selectedCoach.badge_level}</p>
                    </div>
                    <button onClick={() => setAssignStep(1)} className="text-[9px] font-display text-primary">CHANGE</button>
                  </div>

                  {/* Program */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                    <BookOpen size={16} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body text-foreground truncate">{block.title}</p>
                      {block.week_count > 1 && <p className="text-[9px] font-body text-muted-foreground">{block.week_count}-week program</p>}
                    </div>
                  </div>

                  {/* Request type */}
                  <div>
                    <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">REQUEST TYPE</p>
                    <div className="space-y-1.5">
                      {REQUEST_TYPES.map((rt) => (
                        <button key={rt.key} onClick={() => setRequestType(rt.key)}
                          className={`w-full text-left p-3 rounded-xl border transition-colors ${requestType === rt.key ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                          <p className="font-display text-[10px] tracking-wider text-foreground">{rt.label}</p>
                          <p className="text-[9px] font-body text-muted-foreground">{rt.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Packages */}
                  {coachPackages.length > 0 && (
                    <div>
                      <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">SELECT PACKAGE</p>
                      <div className="space-y-1.5">
                        {coachPackages.map((pkg) => (
                          <button key={pkg.id} onClick={() => setSelectedPackage(pkg.id === selectedPackage ? null : pkg.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedPackage === pkg.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-body text-foreground">{pkg.title}</span>
                              <span className="text-xs font-display text-primary">€{pkg.price_per_session}</span>
                            </div>
                            <p className="text-[9px] font-body text-muted-foreground capitalize">{pkg.session_type} · {pkg.duration_minutes}min · {pkg.sport}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {coachPackages.length === 0 && (
                    <p className="text-[10px] font-body text-muted-foreground p-3 rounded-xl bg-secondary">This coach hasn't set up packages yet — send a free request</p>
                  )}

                  {/* Start date */}
                  <div>
                    <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">PROPOSED START DATE</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full px-3 py-2.5 rounded-xl border border-border text-left font-body text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
                          <CalendarDays size={14} className="text-muted-foreground" />
                          {proposedDate ? format(proposedDate, "PPP") : "Pick a date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={proposedDate} onSelect={setProposedDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Sessions count (book_session only) */}
                  {requestType === "book_session" && (
                    <div>
                      <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-1">NUMBER OF SESSIONS</p>
                      <input type="number" value={proposedSessions} onChange={(e) => setProposedSessions(Number(e.target.value))} min={1}
                        className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none" />
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-1">MESSAGE TO COACH</p>
                    <textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-body text-sm focus:outline-none resize-none" />
                  </div>

                  <button onClick={handleSendRequest} disabled={sendingRequest}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    <Send size={14} /> {sendingRequest ? "SENDING..." : "SEND REQUEST"}
                  </button>
                </>
              )}

              {/* STEP 3 — Confirmation */}
              {assignStep === 3 && selectedCoach && (
                <div className="text-center py-8 space-y-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                      <CheckCircle size={40} className="text-green-400" />
                    </div>
                  </motion.div>
                  <div>
                    <h3 className="font-display text-lg text-foreground mb-1">Request sent to {selectedCoach.full_name}!</h3>
                    <p className="text-xs font-body text-muted-foreground">They typically respond within {selectedCoach.response_time_hours || 24} hours</p>
                  </div>
                  <div className="text-left space-y-2 bg-secondary rounded-xl p-4">
                    <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">WHAT HAPPENS NEXT</p>
                    {["Coach reviews your request and program", "Coach accepts and you get notified", "Your program plan is shared with the coach", "Coach can add notes, adjust timing and book sessions"].map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-[9px] shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-xs font-body text-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link to="/dashboard" onClick={onClose} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-display text-[10px] tracking-wider text-center hover:bg-primary/90">VIEW MY PROGRAMS</Link>
                    <Link to="/marketplace" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border font-display text-[10px] tracking-wider text-foreground text-center hover:bg-secondary">BROWSE MORE</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* NORMAL DETAIL VIEW */
          <>
            {/* Header thumbnail */}
            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-end p-5">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-background/50 backdrop-blur-sm text-foreground"><X size={16} /></button>
              <div className="flex items-center gap-3">
                {block.author_avatar_url ? <img src={block.author_avatar_url} className="w-10 h-10 rounded-full border-2 border-border" /> : (
                  <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-primary font-display">{block.author_name?.charAt(0) || "C"}</div>
                )}
                <p className="text-xs font-body text-foreground">{block.author_name || "ACE System"}</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <h2 className="font-display text-xl text-foreground">{block.title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                {(block.rating_count || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-body text-foreground">{(block.rating_avg || 0).toFixed(1)}</span>
                    <span className="text-xs font-body text-muted-foreground">({block.rating_count})</span>
                  </div>
                )}
                <span className="text-xs font-body text-muted-foreground">Used by {block.times_used || 0}</span>
                {block.block_type === "program" && block.week_count > 1 && <span className="text-xs font-body text-primary">{block.week_count}-week program</span>}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                {(["overview", ...(block.block_type === "program" ? ["structure"] : []), "reviews", ...(block.author_id ? ["coach"] : [])] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t as any)}
                    className={`flex-1 py-2 rounded-md font-display text-[10px] tracking-wider transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t.toUpperCase()}</button>
                ))}
              </div>

              {/* Overview */}
              {tab === "overview" && (
                <div className="space-y-4">
                  {block.description && <p className="font-body text-sm text-muted-foreground">{block.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {block.tags?.map((t: string) => <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-xs font-body text-muted-foreground">{t}</span>)}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[["SPORT", block.target_sport || block.sport], ["LEVEL", block.target_level || block.difficulty], ["DURATION", `${block.duration_minutes} min`], ["CATEGORY", block.category?.replace("_", " ")]].map(([label, val]) => (
                      <div key={label} className="bg-secondary rounded-lg p-3">
                        <p className="text-[10px] font-display text-muted-foreground tracking-wider">{label}</p>
                        <p className="text-sm font-body text-foreground capitalize">{val}</p>
                      </div>
                    ))}
                  </div>
                  {block.goals && block.goals.length > 0 && (
                    <div>
                      <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">GOALS</p>
                      <ul className="space-y-1">
                        {(block.goals as string[]).map((g) => <li key={g} className="flex items-center gap-2 text-sm font-body text-foreground"><CheckCircle size={12} className="text-green-400 shrink-0" /> {g}</li>)}
                      </ul>
                    </div>
                  )}
                  {(previewExercises || exercises) && (
                    <div>
                      <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">EXERCISES PREVIEW</p>
                      <div className="space-y-1.5">
                        {((previewExercises || exercises) as any[])?.slice(0, 3).map((ex: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                            <span className="text-xs font-body text-foreground">{ex.name}</span>
                            <span className="text-[9px] font-body text-muted-foreground ml-auto">{ex.sets && `${ex.sets}×${ex.reps || ""}`}{ex.duration_sec && `${ex.duration_sec}s`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Structure */}
              {tab === "structure" && (
                <div className="space-y-2">
                  {weeklyStructure && weeklyStructure.length > 0 ? weeklyStructure.map((week: any, wi: number) => (
                    <div key={wi} className="border border-border rounded-lg">
                      <button onClick={() => toggleWeek(wi)} className="w-full flex items-center justify-between p-3 hover:bg-secondary transition-colors">
                        <span className="font-display text-xs text-foreground">WEEK {week.week || wi + 1} — {week.label || "Training Week"}</span>
                        {expandedWeeks.has(wi) ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                      </button>
                      {expandedWeeks.has(wi) && week.days && (
                        <div className="px-3 pb-3 space-y-1">
                          {(week.days as any[]).map((day: any, di: number) => (
                            <div key={di} className="flex items-center gap-2 p-2 rounded bg-secondary">
                              <span className="text-[10px] font-display text-primary w-10">DAY {day.day || di + 1}</span>
                              <span className="text-xs font-body text-foreground">{day.title || "Training Session"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : <p className="text-sm font-body text-muted-foreground text-center py-8">Program structure available after purchase.</p>}
                </div>
              )}

              {/* Reviews */}
              {tab === "reviews" && (
                <div className="space-y-4">
                  {isOwned && user && (
                    <div className="p-4 rounded-xl bg-secondary border border-border space-y-3">
                      <p className="font-display text-[10px] tracking-wider text-foreground">WRITE A REVIEW</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((s) => <button key={s} onClick={() => setReviewRating(s)}><Star size={18} className={s <= reviewRating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} /></button>)}
                      </div>
                      <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={2} placeholder="Share your experience..."
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none resize-none" />
                      <button onClick={handleSubmitReview} disabled={submittingReview}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider disabled:opacity-50">
                        {submittingReview ? "SUBMITTING..." : "SUBMIT REVIEW"}
                      </button>
                    </div>
                  )}
                  {ratings.length > 0 ? ratings.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg bg-secondary">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-[9px]">{r.reviewer_name?.charAt(0)}</div>
                        <span className="text-xs font-body text-foreground">{r.reviewer_name}</span>
                        <div className="flex gap-0.5 ml-auto">{[1,2,3,4,5].map((s) => <Star key={s} size={10} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />)}</div>
                      </div>
                      {r.review_text && <p className="text-xs font-body text-muted-foreground">{r.review_text}</p>}
                    </div>
                  )) : <p className="text-sm font-body text-muted-foreground text-center py-6">No reviews yet</p>}
                </div>
              )}

              {/* Coach */}
              {tab === "coach" && coachProfile && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                    {coachProfile.avatar_url ? <img src={coachProfile.avatar_url} className="w-14 h-14 rounded-full border-2 border-border" /> : (
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-lg">{coachProfile.full_name?.charAt(0)}</div>
                    )}
                    <div>
                      <h3 className="font-display text-sm text-foreground">{coachProfile.full_name}</h3>
                      {coachProfile.is_verified && <span className="flex items-center gap-1 text-[10px] font-body text-blue-400"><CheckCircle size={10} /> Verified Coach</span>}
                    </div>
                  </div>
                  {coachProfile.bio && <p className="text-sm font-body text-muted-foreground">{coachProfile.bio}</p>}
                  {coachProfile.profile_slug && (
                    <Link to={`/coach/${coachProfile.profile_slug}`} className="flex items-center gap-2 text-primary font-display text-xs tracking-wider hover:underline">
                      VIEW FULL PROFILE <ExternalLink size={12} />
                    </Link>
                  )}
                  {coachOtherBlocks.length > 0 && (
                    <div>
                      <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">OTHER PROGRAMS BY THIS COACH</p>
                      {coachOtherBlocks.map((b: any) => (
                        <div key={b.id} className="p-3 rounded-lg bg-secondary mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-body text-foreground">{b.title}</span>
                          <span className="text-[10px] font-display text-primary">{b.price > 0 ? `€${b.price}` : "FREE"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="sticky bottom-0 p-4 bg-card border-t border-border space-y-2">
              {isOwned ? (
                <>
                  <Link to="/dashboard" className="block w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider text-center hover:bg-primary/90 transition-colors">ADD TO MY PLAN</Link>
                  <button onClick={openAssignFlow} className="w-full py-3 rounded-xl border border-border font-display text-xs tracking-wider text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2">
                    <UserPlus size={14} /> ASSIGN A COACH
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-xl text-foreground">{block.price > 0 ? `€${block.price}` : "FREE"}</span>
                    <button onClick={() => onToggleSave(block)} className={`p-2 rounded-lg ${isSaved ? "text-primary" : "text-muted-foreground"}`}>
                      <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <button onClick={() => onGetProgram(block)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors">
                    {block.price > 0 ? `BUY — €${block.price}` : "GET FREE PROGRAM"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default BlockDetailDrawer;
