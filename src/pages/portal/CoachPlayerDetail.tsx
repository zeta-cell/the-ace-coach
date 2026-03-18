import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowLeft, Target, TrendingDown, Calendar, CalendarDays, Plus, Mail, Phone, MessageCircle, ChevronDown, ChevronUp, User, BookOpen, CheckCircle, Video, Dumbbell, Globe, Edit3, Save, X, Clock } from "lucide-react";
import UpcomingSchedule from "@/components/portal/UpcomingSchedule";
import { format, addDays } from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import { toast } from "sonner";
import QuickAddTrainingDrawer from "@/components/portal/QuickAddTrainingDrawer";

interface ActiveProgram {
  request_id: string;
  block_id: string;
  block_title: string;
  author_name: string | null;
  author_avatar_url: string | null;
  week_count: number;
  current_week: number;
  weekly_structure: any;
}

const CoachPlayerDetail = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [playerData, setPlayerData] = useState<any>(null);
  const [rackets, setRackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [activePrograms, setActivePrograms] = useState<ActiveProgram[]>([]);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [trainDrawerOpen, setTrainDrawerOpen] = useState(false);
  const [upcomingPlans, setUpcomingPlans] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && playerId) fetchAll();
  }, [user, playerId]);

  const fetchAll = async () => {
    if (!playerId || !user) return;
    const [{ data: prof }, { data: pp }, { data: rk }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", playerId).single(),
      supabase.from("player_profiles").select("*").eq("user_id", playerId).single(),
      supabase.from("player_rackets").select("*").eq("player_id", playerId),
    ]);
    setProfileData(prof);
    setPlayerData(pp);
    setRackets(rk || []);

    // Fetch active programs (accepted coach_requests with block_id for this player)
    const { data: requests } = await supabase
      .from("coach_requests").select("id, block_id")
      .eq("coach_id", user.id).eq("player_id", playerId)
      .eq("status", "accepted").not("block_id", "is", null);

    if (requests && requests.length > 0) {
      const blockIds = requests.map((r) => r.block_id!).filter(Boolean);
      const { data: blocks } = await supabase
        .from("training_blocks").select("id, title, author_name, author_avatar_url, week_count, weekly_structure")
        .in("id", blockIds);

      // Also fetch current_week from block_purchases
      const { data: purchases } = await supabase
        .from("block_purchases").select("block_id, current_week")
        .eq("buyer_id", playerId).in("block_id", blockIds);

      const blockMap = new Map((blocks as any[])?.map((b) => [b.id, b]) || []);
      const purchaseMap = new Map(purchases?.map((p) => [p.block_id, p.current_week || 1]) || []);

      setActivePrograms(requests.map((r) => {
        const b = blockMap.get(r.block_id);
        return {
          request_id: r.id,
          block_id: r.block_id!,
          block_title: b?.title || "Program",
          author_name: b?.author_name || null,
          author_avatar_url: b?.author_avatar_url || null,
          week_count: b?.week_count || 1,
          current_week: purchaseMap.get(r.block_id) || 1,
          weekly_structure: b?.weekly_structure,
        };
      }));
    }

    // Fetch upcoming 7 days of training
    const today = format(new Date(), "yyyy-MM-dd");
    const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");
    const { data: plans } = await supabase
      .from("player_day_plans")
      .select("id, plan_date, notes, start_time")
      .eq("player_id", playerId)
      .gte("plan_date", today)
      .lte("plan_date", nextWeek)
      .order("plan_date");
    setUpcomingPlans(plans || []);

    setLoading(false);
  };

  const markWeekComplete = async (prog: ActiveProgram) => {
    const nextWeek = Math.min(prog.current_week + 1, prog.week_count);
    await supabase.from("block_purchases").update({ current_week: nextWeek })
      .eq("buyer_id", playerId!).eq("block_id", prog.block_id);
    toast.success(`Week ${prog.current_week} completed!`);
    setActivePrograms((prev) => prev.map((p) => p.block_id === prog.block_id ? { ...p, current_week: nextWeek } : p));
  };

  const handleSaveAbilities = async () => {
    if (!playerId || !editData) return;
    setSaving(true);
    const { error } = await supabase.from("player_profiles").update({
      fitness_level: editData.fitness_level,
      playtomic_level: editData.playtomic_level,
      dominant_hand: editData.dominant_hand,
      preferred_sport: editData.preferred_sport,
      best_shot: editData.best_shot,
      weakest_shot: editData.weakest_shot,
      volley_pct: editData.volley_pct,
      forehand_pct: editData.forehand_pct,
      serve_pct: editData.serve_pct,
      smash_pct: editData.smash_pct,
      backhand_pct: editData.backhand_pct,
      lob_pct: editData.lob_pct,
      left_tendency_pct: editData.left_tendency_pct,
      right_tendency_pct: editData.right_tendency_pct,
    }).eq("user_id", playerId);

    if (error) {
      toast.error("Failed to save changes");
    } else {
      setPlayerData({ ...playerData, ...editData });
      toast.success("Player abilities updated");
      setEditMode(false);
    }
    setSaving(false);
  };

  if (loading) {
    return <PortalLayout><div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></PortalLayout>;
  }

  const shots = playerData
    ? [
        { name: "Volley", pct: playerData.volley_pct ?? 50 },
        { name: "Forehand", pct: playerData.forehand_pct ?? 50 },
        { name: "Serve", pct: playerData.serve_pct ?? 50 },
        { name: "Smash", pct: playerData.smash_pct ?? 50 },
        { name: "Backhand", pct: playerData.backhand_pct ?? 50 },
        { name: "Lob", pct: playerData.lob_pct ?? 50 },
      ].sort((a, b) => b.pct - a.pct)
    : [];

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto">
        <Link to="/coach/players" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Players
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-2xl">
              {profileData?.full_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl text-foreground">{profileData?.full_name}</h1>
              <p className="font-body text-sm text-muted-foreground">
                {playerData?.fitness_level || "—"} · Level {playerData?.playtomic_level ?? "—"} · {playerData?.dominant_hand || "—"} hand
              </p>
            </div>
            <Link to={`/training?player=${playerId}&date=${format(new Date(), "yyyy-MM-dd")}`}
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">
              <CalendarDays size={18} />
            </Link>
          </div>

          {/* Active Programs */}
          {activePrograms.length > 0 && (
            <div className="mb-6 space-y-2">
              <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen size={14} className="text-primary" /> ACTIVE PROGRAMS
              </h3>
              {activePrograms.map((prog) => {
                const progress = prog.week_count > 1 ? Math.round((prog.current_week / prog.week_count) * 100) : 100;
                const isExpanded = expandedProgram === prog.block_id;
                const ws = prog.weekly_structure as any[] | null;
                return (
                  <div key={prog.block_id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                          <BookOpen size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm text-foreground truncate">{prog.block_title}</p>
                          {/* Program credit */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {prog.author_avatar_url ? <img src={prog.author_avatar_url} className="w-4 h-4 rounded-full" /> : null}
                            <span className="text-[9px] font-body text-muted-foreground">Program by {prog.author_name || "ACE"}</span>
                          </div>
                        </div>
                        <span className="text-xs font-body text-primary shrink-0">Week {prog.current_week} of {prog.week_count}</span>
                      </div>
                      {prog.week_count > 1 && (
                        <div className="w-full h-1.5 bg-muted rounded-full mb-3">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => setExpandedProgram(isExpanded ? null : prog.block_id)}
                          className="flex-1 py-2 rounded-lg border border-border font-display text-[10px] tracking-wider text-foreground hover:bg-secondary transition-colors">
                          {isExpanded ? "HIDE STRUCTURE" : "VIEW FULL PROGRAM"}
                        </button>
                        <button onClick={() => navigate(`/coach/plan/${playerId}?week=${prog.current_week}&block_id=${prog.block_id}`)}
                          className="flex-1 py-2 rounded-lg border border-border font-display text-[10px] tracking-wider text-foreground hover:bg-secondary transition-colors text-center">
                          ADJUST THIS WEEK
                        </button>
                        <button onClick={() => markWeekComplete(prog)}
                          className="py-2 px-3 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-1">
                          <CheckCircle size={12} /> COMPLETE WEEK
                        </button>
                      </div>
                    </div>
                    {/* Expanded weekly structure */}
                    {isExpanded && ws && (
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                        {ws.map((week: any, wi: number) => (
                          <div key={wi} className={`rounded-lg p-3 ${wi + 1 === prog.current_week ? "bg-primary/5 border border-primary/20" : "bg-secondary"}`}>
                            <p className="font-display text-[10px] tracking-wider text-foreground mb-1.5">
                              WEEK {week.week || wi + 1} — {week.label || "Training Week"}
                              {wi + 1 === prog.current_week && <span className="ml-2 text-primary">← CURRENT</span>}
                            </p>
                            {week.days && (week.days as any[]).map((day: any, di: number) => (
                              <div key={di} className="flex items-center gap-2 py-1">
                                <span className="text-[9px] font-display text-primary w-8">DAY {day.day || di + 1}</span>
                                <span className="text-[10px] font-body text-foreground">{day.title || "Training Session"}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Contact Info — collapsible */}
          <div className="bg-card border border-border rounded-xl mb-6 overflow-hidden">
            <button onClick={() => setInfoOpen(!infoOpen)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2">
                <User size={16} className="text-muted-foreground" />
                <h3 className="font-display text-sm tracking-wider text-muted-foreground">PLAYER INFO</h3>
              </div>
              {infoOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
            {infoOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm font-body text-foreground">
                  <Calendar size={14} className="text-muted-foreground shrink-0" />
                  <span>{playerData?.date_of_birth ? (() => { const dob = new Date(playerData.date_of_birth); const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)); return `${dob.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} (${age} years)`; })() : "No date of birth"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-body text-foreground">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  <span>{profileData?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-body text-foreground">
                  <Phone size={14} className="text-muted-foreground shrink-0" />
                  <span>{profileData?.phone || "No phone"}</span>
                </div>
                {playerData?.nationality && (
                  <div className="flex items-center gap-2 text-sm font-body text-foreground">
                    <Globe size={14} className="text-muted-foreground shrink-0" />
                    <span>{playerData.nationality}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons row */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button onClick={() => navigate(`/training?player=${playerId}&date=${format(new Date(), "yyyy-MM-dd")}`)}
              className="py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-widest hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Dumbbell size={14} /> CREATE TRAINING
            </button>
            <button onClick={() => navigate(`/messages?to=${playerId}`)}
              className="py-2.5 rounded-xl bg-card border border-border text-foreground font-display text-xs tracking-widest hover:bg-secondary transition-colors flex items-center justify-center gap-2">
              <MessageCircle size={14} /> MESSAGE
            </button>
            <Link to={`/coach/videos`}
              className="py-2.5 rounded-xl bg-card border border-border text-foreground font-display text-xs tracking-widest hover:bg-secondary transition-colors flex items-center justify-center gap-2">
              <Video size={14} /> VIDEOS
            </Link>
          </div>

          {/* Upcoming training — collapsible */}
          {upcomingPlans.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setUpcomingOpen(!upcomingOpen)}
                className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-primary" />
                  <span className="font-display text-[10px] tracking-wider text-muted-foreground">UPCOMING TRAINING</span>
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 font-display text-[10px] text-primary">{upcomingPlans.length}</span>
                </div>
                {upcomingOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </button>
              {upcomingOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 space-y-1.5 overflow-hidden"
                >
                  {upcomingPlans.map((plan, idx) => (
                    <Link key={plan.id} to={`/training?player=${playerId}&date=${plan.plan_date}`}>
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                          <span className="font-display text-[9px] tracking-wider text-primary leading-none">{format(new Date(plan.plan_date + "T00:00:00"), "EEE").toUpperCase()}</span>
                          <span className="font-display text-base text-foreground leading-tight">{format(new Date(plan.plan_date + "T00:00:00"), "d")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-foreground truncate">{plan.notes || "Training session"}</p>
                          {plan.start_time && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={10} className="text-muted-foreground" />
                              <span className="text-[10px] font-body text-muted-foreground">{plan.start_time?.slice(0, 5)}</span>
                            </div>
                          )}
                        </div>
                        <ChevronDown size={12} className="text-muted-foreground -rotate-90 shrink-0" />
                      </motion.div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Edit / View toggle for abilities */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground">ABILITIES & LEVELS</h3>
            {!editMode ? (
              <button onClick={() => { setEditMode(true); setEditData({ ...playerData }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 font-display text-[10px] tracking-wider transition-colors">
                <Edit3 size={12} /> EDIT
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditMode(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground font-display text-[10px] tracking-wider transition-colors">
                  <X size={12} /> CANCEL
                </button>
                <button onClick={handleSaveAbilities} disabled={saving}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-display text-[10px] tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  <Save size={12} /> {saving ? "SAVING..." : "SAVE"}
                </button>
              </div>
            )}
          </div>

          {/* Fitness level, Playtomic level, dominant hand, best/weakest shot */}
          {editMode && editData ? (
            <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">FITNESS LEVEL</label>
                  <select value={editData.fitness_level || ""} onChange={(e) => setEditData({ ...editData, fitness_level: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">PLAYTOMIC LEVEL</label>
                  <input type="number" step="0.1" min="1" max="10" value={editData.playtomic_level ?? ""} onChange={(e) => setEditData({ ...editData, playtomic_level: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">DOMINANT HAND</label>
                  <select value={editData.dominant_hand || ""} onChange={(e) => setEditData({ ...editData, dominant_hand: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">—</option>
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                    <option value="ambidextrous">Ambidextrous</option>
                  </select>
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">PREFERRED SPORT</label>
                  <select value={editData.preferred_sport || ""} onChange={(e) => setEditData({ ...editData, preferred_sport: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="padel">Padel</option>
                    <option value="tennis">Tennis</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">BEST SHOT</label>
                  <select value={editData.best_shot || ""} onChange={(e) => setEditData({ ...editData, best_shot: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">—</option>
                    {["Forehand", "Backhand", "Volley", "Serve", "Smash", "Lob"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-display text-[10px] tracking-wider text-muted-foreground">WEAKEST SHOT</label>
                  <select value={editData.weakest_shot || ""} onChange={(e) => setEditData({ ...editData, weakest_shot: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">—</option>
                    {["Forehand", "Backhand", "Volley", "Serve", "Smash", "Lob"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <Target size={20} className="text-primary flex-shrink-0" />
                <div>
                  <p className="font-display text-lg text-foreground">{playerData?.best_shot || "—"}</p>
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Best Shot</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <TrendingDown size={20} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-display text-lg text-foreground">{playerData?.weakest_shot || "—"}</p>
                  <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wide">Weakest Shot</p>
                </div>
              </div>
            </div>
          )}

          {/* Shot confidence */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">SHOT CONFIDENCE</h3>
            {editMode && editData ? (
              <div className="space-y-3">
                {["Volley", "Forehand", "Serve", "Smash", "Backhand", "Lob"].map((shotName) => {
                  const key = `${shotName.toLowerCase()}_pct`;
                  const value = editData[key] ?? 50;
                  return (
                    <div key={shotName}>
                      <div className="flex justify-between mb-1">
                        <span className="font-body text-xs text-foreground">{shotName}</span>
                        <span className="font-body text-xs text-primary font-medium">{value}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={value}
                        onChange={(e) => setEditData({ ...editData, [key]: parseInt(e.target.value) })}
                        className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {shots.map((shot, idx) => (
                  <div key={shot.name}>
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-xs text-foreground">{shot.name}</span>
                      <span className="font-body text-xs text-muted-foreground">{shot.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${shot.pct}%`, backgroundColor: idx < 2 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side tendency */}
          {playerData && (
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">SIDE PREFERENCE</h3>
              {editMode && editData ? (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-xs text-foreground">Left {editData.left_tendency_pct ?? 50}%</span>
                    <span className="font-body text-xs text-foreground">Right {100 - (editData.left_tendency_pct ?? 50)}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={editData.left_tendency_pct ?? 50}
                    onChange={(e) => {
                      const left = parseInt(e.target.value);
                      setEditData({ ...editData, left_tendency_pct: left, right_tendency_pct: 100 - left });
                    }}
                    className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                </div>
              ) : (
                <div className="flex h-8 rounded-full overflow-hidden">
                  <div className="bg-primary flex items-center justify-center" style={{ width: `${playerData.left_tendency_pct}%` }}>
                    <span className="text-primary-foreground text-xs font-body font-medium px-2">L {playerData.left_tendency_pct}%</span>
                  </div>
                  <div className="bg-secondary flex items-center justify-center" style={{ width: `${playerData.right_tendency_pct}%` }}>
                    <span className="text-muted-foreground text-xs font-body font-medium px-2">R {playerData.right_tendency_pct}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rackets */}
          {rackets.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">RACKETS</h3>
              <div className="space-y-2">
                {rackets.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-secondary rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-body text-sm text-foreground">{r.brand} {r.model}</p>
                      <p className="text-xs text-muted-foreground font-body">{r.type} {r.is_favorite ? "⭐" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Quick plan link */}
          <Link to={`/coach/plan/${playerId}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-widest hover:bg-primary/90 transition-colors">
            <Plus size={16} /> CREATE DAY PLAN
          </Link>
        </motion.div>

        <QuickAddTrainingDrawer
          open={trainDrawerOpen}
          onClose={() => setTrainDrawerOpen(false)}
          prefilledPlayerId={playerId}
        />
      </div>
    </PortalLayout>
  );
};

export default CoachPlayerDetail;
