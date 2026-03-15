import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Star, Clock, Users, CheckCircle, ChevronRight, ChevronDown,
  Heart, Award, MapPin, Play, Send, ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface MarketplaceBlock {
  id: string;
  title: string;
  description: string | null;
  category: string;
  sport: string;
  duration_minutes: number;
  difficulty: string;
  goals: string[];
  exercises: any[];
  is_for_sale: boolean;
  price: number;
  currency: string;
  block_type: string;
  week_count: number;
  times_used: number;
  rating_avg: number;
  rating_count: number;
  tags: string[];
  thumbnail_url: string | null;
  preview_exercises: any;
  weekly_structure: any;
  target_level: string | null;
  target_sport: string;
  author_id: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  coach_id: string | null;
  [key: string]: any;
}

interface BlockRating {
  id: string;
  rating: number;
  review_text: string | null;
  rated_at: string;
  rated_by: string;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
}

interface Props {
  block: MarketplaceBlock | null;
  onClose: () => void;
  isOwned: boolean;
  onGetProgram: (block: MarketplaceBlock) => void;
  onToggleSave: (block: MarketplaceBlock) => void;
  isSaved: boolean;
}

const BlockDetailDrawer = ({ block, onClose, isOwned, onGetProgram, onToggleSave, isSaved }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "structure" | "reviews" | "coach">("overview");
  const [ratings, setRatings] = useState<BlockRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [coachOtherBlocks, setCoachOtherBlocks] = useState<any[]>([]);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showCoachRequest, setShowCoachRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (block) {
      setTab("overview");
      fetchRatings();
      if (block.author_id) fetchCoachInfo();
    }
  }, [block?.id]);

  const fetchRatings = async () => {
    if (!block) return;
    setLoadingRatings(true);
    const { data } = await supabase
      .from("block_ratings").select("*").eq("block_id", block.id).order("rated_at", { ascending: false });
    if (data && data.length > 0) {
      const userIds = data.map((r) => r.rated_by);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      setRatings(data.map((r) => ({
        ...r,
        reviewer_name: profileMap.get(r.rated_by)?.full_name || "Anonymous",
        reviewer_avatar: profileMap.get(r.rated_by)?.avatar_url,
      })));
    } else {
      setRatings([]);
    }
    setLoadingRatings(false);
  };

  const fetchCoachInfo = async () => {
    if (!block?.author_id) return;
    const [profileRes, coachRes, blocksRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", block.author_id).single(),
      supabase.from("coach_profiles").select("*").eq("user_id", block.author_id).single(),
      supabase.from("training_blocks").select("*").eq("is_public", true).eq("coach_id", block.author_id).neq("id", block.id).limit(3),
    ]);
    setCoachProfile({ ...(profileRes.data || {}), ...(coachRes.data || {}) });
    setCoachOtherBlocks(blocksRes.data || []);
  };

  const handleSubmitReview = async () => {
    if (!user || !block) return;
    setSubmittingReview(true);
    await supabase.from("block_ratings").upsert({
      block_id: block.id, rated_by: user.id, rating: reviewRating, review_text: reviewText.trim() || null,
    } as any, { onConflict: "block_id,rated_by" });
    await supabase.rpc("update_block_rating_avg", { p_block_id: block.id });
    toast.success("Review submitted!");
    setReviewText("");
    fetchRatings();
    setSubmittingReview(false);
  };

  const handleSendCoachRequest = async () => {
    if (!user || !block?.author_id) return;
    setSendingRequest(true);
    await supabase.from("coach_requests").insert({
      player_id: user.id, coach_id: block.author_id, block_id: block.id,
      request_type: "guide_program",
      message: requestMessage || `I purchased your "${block.title}" program and would love your personal guidance.`,
    } as any);
    toast.success(`Request sent! They'll respond soon.`);
    setShowCoachRequest(false);
    setRequestMessage("");
    setSendingRequest(false);
  };

  const toggleWeek = (w: number) => {
    setExpandedWeeks((prev) => { const n = new Set(prev); n.has(w) ? n.delete(w) : n.add(w); return n; });
  };

  if (!block) return null;

  const weeklyStructure = block.weekly_structure as any[] | null;
  const previewExercises = block.preview_exercises as any[] | null;
  const exercises = block.exercises as any[] | null;

  return (
    <Sheet open={!!block} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full max-w-lg p-0 bg-card border-l border-border overflow-y-auto">
        {/* Header thumbnail */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-end p-5">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-background/50 backdrop-blur-sm text-foreground"><X size={16} /></button>
          <div className="flex items-center gap-3">
            {block.author_avatar_url ? (
              <img src={block.author_avatar_url} className="w-10 h-10 rounded-full border-2 border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-primary font-display">{block.author_name?.charAt(0) || "C"}</div>
            )}
            <div>
              <p className="text-xs font-body text-foreground">{block.author_name || "ACE System"}</p>
            </div>
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
            {block.block_type === "program" && block.week_count > 1 && (
              <span className="text-xs font-body text-primary">{block.week_count}-week program</span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            {(["overview", ...(block.block_type === "program" ? ["structure"] : []), "reviews", ...(block.author_id ? ["coach"] : [])] as const).map((t) => (
              <button key={t} onClick={() => setTab(t as any)}
                className={`flex-1 py-2 rounded-md font-display text-[10px] tracking-wider transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>{t.toUpperCase()}</button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === "overview" && (
            <div className="space-y-4">
              {block.description && <p className="font-body text-sm text-muted-foreground">{block.description}</p>}
              <div className="flex flex-wrap gap-2">
                {block.tags?.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-xs font-body text-muted-foreground">{t}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] font-display text-muted-foreground tracking-wider">SPORT</p>
                  <p className="text-sm font-body text-foreground capitalize">{block.target_sport || block.sport}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] font-display text-muted-foreground tracking-wider">LEVEL</p>
                  <p className="text-sm font-body text-foreground capitalize">{block.target_level || block.difficulty}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] font-display text-muted-foreground tracking-wider">DURATION</p>
                  <p className="text-sm font-body text-foreground">{block.duration_minutes} min</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[10px] font-display text-muted-foreground tracking-wider">CATEGORY</p>
                  <p className="text-sm font-body text-foreground capitalize">{block.category?.replace("_", " ")}</p>
                </div>
              </div>
              {block.goals && block.goals.length > 0 && (
                <div>
                  <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">GOALS</p>
                  <ul className="space-y-1">
                    {(block.goals as string[]).map((g) => (
                      <li key={g} className="flex items-center gap-2 text-sm font-body text-foreground">
                        <CheckCircle size={12} className="text-green-400 shrink-0" /> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Preview exercises */}
              {(previewExercises || exercises) && (
                <div>
                  <p className="font-display text-[10px] tracking-wider text-muted-foreground mb-2">EXERCISES PREVIEW</p>
                  <div className="space-y-1.5">
                    {((previewExercises || exercises) as any[])?.slice(0, 3).map((ex: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                        <span className="text-xs font-body text-foreground">{ex.name}</span>
                        <span className="text-[9px] font-body text-muted-foreground ml-auto">
                          {ex.sets && `${ex.sets}×${ex.reps || ""}`}{ex.duration_sec && `${ex.duration_sec}s`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {((previewExercises || exercises) as any[])?.length > 3 && (
                    <p className="text-[10px] font-body text-primary mt-2">See full program after purchase</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Structure tab */}
          {tab === "structure" && (
            <div className="space-y-2">
              {weeklyStructure && weeklyStructure.length > 0 ? (
                weeklyStructure.map((week: any, wi: number) => (
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
                ))
              ) : (
                <p className="text-sm font-body text-muted-foreground text-center py-8">Program structure will be available after purchase.</p>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {tab === "reviews" && (
            <div className="space-y-4">
              {isOwned && user && (
                <div className="p-4 rounded-xl bg-secondary border border-border space-y-3">
                  <p className="font-display text-[10px] tracking-wider text-foreground">WRITE A REVIEW</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => setReviewRating(s)}>
                        <Star size={18} className={s <= reviewRating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={2}
                    placeholder="Share your experience..."
                    className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-sm focus:outline-none resize-none" />
                  <button onClick={handleSubmitReview} disabled={submittingReview}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider disabled:opacity-50">
                    {submittingReview ? "SUBMITTING..." : "SUBMIT REVIEW"}
                  </button>
                </div>
              )}
              {ratings.length > 0 ? (
                ratings.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-[9px]">
                        {r.reviewer_name?.charAt(0)}
                      </div>
                      <span className="text-xs font-body text-foreground">{r.reviewer_name}</span>
                      <div className="flex gap-0.5 ml-auto">
                        {[1,2,3,4,5].map((s) => <Star key={s} size={10} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"} />)}
                      </div>
                    </div>
                    {r.review_text && <p className="text-xs font-body text-muted-foreground">{r.review_text}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm font-body text-muted-foreground text-center py-6">No reviews yet</p>
              )}
            </div>
          )}

          {/* Coach tab */}
          {tab === "coach" && coachProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
                {coachProfile.avatar_url ? (
                  <img src={coachProfile.avatar_url} className="w-14 h-14 rounded-full border-2 border-border" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-lg">
                    {coachProfile.full_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-sm text-foreground">{coachProfile.full_name}</h3>
                  {coachProfile.is_verified && (
                    <span className="flex items-center gap-1 text-[10px] font-body text-blue-400"><CheckCircle size={10} /> Verified Coach</span>
                  )}
                </div>
              </div>
              {coachProfile.bio && <p className="text-sm font-body text-muted-foreground">{coachProfile.bio}</p>}
              {coachProfile.profile_slug && (
                <Link to={`/coach/${coachProfile.profile_slug}`}
                  className="flex items-center gap-2 text-primary font-display text-xs tracking-wider hover:underline">
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

        {/* Bottom action bar */}
        <div className="sticky bottom-0 p-4 bg-card border-t border-border space-y-2">
          {isOwned ? (
            <>
              <Link to="/dashboard" className="block w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider text-center hover:bg-primary/90 transition-colors">
                ADD TO MY PLAN
              </Link>
              {block.author_id && (
                <button onClick={() => setShowCoachRequest(true)}
                  className="w-full py-3 rounded-xl border border-border font-display text-xs tracking-wider text-foreground hover:bg-secondary transition-colors">
                  ASSIGN A COACH
                </button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-xl text-foreground">{block.price > 0 ? `€${block.price}` : "FREE"}</span>
                <button onClick={() => onToggleSave(block)} className={`p-2 rounded-lg ${isSaved ? "text-primary" : "text-muted-foreground"}`}>
                  <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>
              <button onClick={() => onGetProgram(block)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors">
                {block.price > 0 ? `BUY — €${block.price}` : "GET FREE PROGRAM"}
              </button>
            </>
          )}
        </div>

        {/* Coach request modal */}
        <AnimatePresence>
          {showCoachRequest && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 flex items-center justify-center p-4 z-10">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm text-foreground">ASSIGN A COACH</h3>
                  <button onClick={() => setShowCoachRequest(false)}><X size={16} /></button>
                </div>
                <div className="p-3 rounded-lg bg-secondary">
                  <p className="font-display text-xs text-foreground mb-1">REQUEST THE PROGRAM AUTHOR</p>
                  <p className="text-[10px] font-body text-muted-foreground">{block.author_name || "Coach"}</p>
                </div>
                <textarea value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder={`Tell ${block.author_name || "the coach"} what you want to achieve...`}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none resize-none" />
                <button onClick={handleSendCoachRequest} disabled={sendingRequest}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider disabled:opacity-50">
                  <Send size={12} className="inline mr-2" />{sendingRequest ? "SENDING..." : "SEND REQUEST"}
                </button>
                <Link to={`/find-a-coach${block.target_sport && block.target_sport !== "both" ? `?sport=${block.target_sport}` : ""}`}
                  className="block text-center text-xs font-body text-primary hover:underline">
                  BROWSE COACHES FOR THIS PROGRAM →
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default BlockDetailDrawer;
