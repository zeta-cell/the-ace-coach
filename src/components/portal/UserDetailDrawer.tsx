import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import UpcomingSchedule from "@/components/portal/UpcomingSchedule";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Target, TrendingDown, Star, ExternalLink,
  UserCheck, UserX, Link2, Phone, MessageSquare,
  Globe, Award, Briefcase, CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type AppRole = "player" | "coach" | "admin";

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  role: AppRole;
}

interface PlayerProfile {
  dominant_hand: string | null;
  fitness_level: string | null;
  years_playing: number | null;
  playtomic_level: number | null;
  playtomic_url: string | null;
  left_tendency_pct: number | null;
  right_tendency_pct: number | null;
  volley_pct: number | null;
  forehand_pct: number | null;
  serve_pct: number | null;
  smash_pct: number | null;
  backhand_pct: number | null;
  lob_pct: number | null;
  best_shot: string | null;
  weakest_shot: string | null;
}

interface CoachProfile {
  bio: string | null;
  specializations: string[] | null;
  certifications: string[] | null;
  years_experience: number | null;
  phone: string | null;
  coaching_style: string | null;
  dominant_hand: string | null;
  preferred_side: string | null;
  volley_pct: number | null;
  forehand_pct: number | null;
  serve_pct: number | null;
  smash_pct: number | null;
  backhand_pct: number | null;
  lob_pct: number | null;
  best_shot: string | null;
  weakest_shot: string | null;
  playtomic_level: number | null;
  playtomic_url: string | null;
  nationality: string | null;
  languages: string[] | null;
  racket_brand: string | null;
  racket_model: string | null;
  racket_type: string | null;
}

interface Racket {
  id: string;
  brand: string;
  model: string;
  type: string | null;
  is_favorite: boolean | null;
}

interface Props {
  user: UserRow | null;
  open: boolean;
  onClose: () => void;
  onUserUpdate: (userId: string, updates: Partial<UserRow>) => void;
}

const ROLE_COLORS: Record<AppRole, string> = {
  player: "bg-blue-500/10 text-blue-400",
  coach: "bg-purple-500/10 text-purple-400",
  admin: "bg-primary/10 text-primary",
};

const ShotBars = ({ shots }: { shots: { name: string; pct: number }[] }) => (
  <div className="space-y-2">
    {shots.map((shot, idx) => (
      <div key={shot.name} className="flex items-center gap-3">
        <span className="text-xs font-body text-muted-foreground w-20 text-right">{shot.name}</span>
        <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full flex items-center justify-end pr-2 text-[10px] font-display text-primary-foreground"
            style={{
              width: `${shot.pct}%`,
              backgroundColor: idx < 2 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
            }}
          >
            {shot.pct}%
          </div>
        </div>
      </div>
    ))}
  </div>
);

const BestWorstShots = ({ best, weakest }: { best: string | null; weakest: string | null }) => (
  <div className="grid grid-cols-2 gap-3">
    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
      <Target size={16} className="text-green-400 shrink-0" />
      <div>
        <p className="text-[10px] font-body text-green-400 uppercase">Best Shot</p>
        <p className="font-display text-sm text-foreground">{best || "—"}</p>
      </div>
    </div>
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
      <TrendingDown size={16} className="text-destructive shrink-0" />
      <div>
        <p className="text-[10px] font-body text-destructive uppercase">Weakest</p>
        <p className="font-display text-sm text-foreground">{weakest || "—"}</p>
      </div>
    </div>
  </div>
);

const buildShots = (data: { volley_pct: number | null; forehand_pct: number | null; serve_pct: number | null; smash_pct: number | null; backhand_pct: number | null; lob_pct: number | null }) =>
  [
    { name: "Volley", pct: data.volley_pct ?? 50 },
    { name: "Forehand", pct: data.forehand_pct ?? 50 },
    { name: "Serve", pct: data.serve_pct ?? 50 },
    { name: "Smash", pct: data.smash_pct ?? 50 },
    { name: "Backhand", pct: data.backhand_pct ?? 50 },
    { name: "Lob", pct: data.lob_pct ?? 50 },
  ].sort((a, b) => b.pct - a.pct);

const UserDetailDrawer = ({ user, open, onClose, onUserUpdate }: Props) => {
  const navigate = useNavigate();
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [rackets, setRackets] = useState<Racket[]>([]);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchData(user);
    } else {
      setPlayerProfile(null);
      setCoachProfile(null);
      setRackets([]);
      setUserPhone(null);
    }
  }, [open, user]);

  const fetchData = async (u: UserRow) => {
    setLoadingProfile(true);

    // Always fetch phone from profiles
    const { data: profData } = await supabase
      .from("profiles")
      .select("phone")
      .eq("user_id", u.user_id)
      .single();
    setUserPhone((profData as any)?.phone || null);

    if (u.role === "player") {
      const [profileRes, racketsRes] = await Promise.all([
        supabase.from("player_profiles").select("*").eq("user_id", u.user_id).single(),
        supabase.from("player_rackets").select("*").eq("player_id", u.user_id),
      ]);
      if (profileRes.data) setPlayerProfile(profileRes.data as unknown as PlayerProfile);
      setRackets((racketsRes.data as unknown as Racket[]) || []);
    } else if (u.role === "coach") {
      const { data } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("user_id", u.user_id)
        .single();
      if (data) setCoachProfile(data as unknown as CoachProfile);
    }

    setLoadingProfile(false);
  };

  const changeRole = async (newRole: AppRole) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: user.user_id, role: newRole }, { onConflict: "user_id" });
    if (error) { toast.error("Failed to change role"); return; }
    toast.success(`Role changed to ${newRole}`);
    onUserUpdate(user.user_id, { role: newRole });
  };

  const toggleActive = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !user.is_active } as any)
      .eq("user_id", user.user_id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(user.is_active ? "User deactivated" : "User activated");
    onUserUpdate(user.user_id, { is_active: !user.is_active });
  };

  const handleMessage = () => {
    if (!user) return;
    onClose();
    navigate(`/messages?to=${user.user_id}`);
  };

  if (!user) return null;

  const playerShots = playerProfile ? buildShots(playerProfile) : [];
  const coachShots = coachProfile ? buildShots(coachProfile) : [];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-card border-l border-border z-50 overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 pr-10">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-xl shrink-0">
                  {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl text-foreground truncate">{user.full_name}</h2>
                  <p className="text-sm font-body text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-md font-body text-[10px] uppercase tracking-wider ${ROLE_COLORS[user.role]}`}>
                      {user.role}
                    </span>
                    <span className="text-[10px] font-body text-muted-foreground">
                      Joined {format(new Date(user.created_at), "d MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone */}
              {userPhone && (
                <a
                  href={`tel:${userPhone}`}
                  className="flex items-center gap-2 text-sm font-body text-foreground bg-secondary/50 rounded-lg p-3 hover:bg-secondary transition-colors"
                >
                  <Phone size={14} className="text-primary shrink-0" />
                  {userPhone}
                </a>
              )}

              {/* Contact buttons for coaches */}
              {user.role === "coach" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleMessage}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors"
                  >
                    <MessageSquare size={14} /> MESSAGE
                  </button>
                  {(coachProfile?.phone || userPhone) && (
                    <a
                      href={`https://wa.me/${(coachProfile?.phone || userPhone || "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/20 text-green-400 font-display text-xs tracking-wider hover:bg-green-500/30 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WA
                    </a>
                  )}
                </div>
              )}

              {/* Calendar link for coaches */}
              {user.role === "coach" && (
                <button
                  onClick={() => { onClose(); navigate(`/admin/schedule/coach/${user.user_id}`); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-secondary text-foreground font-display text-xs tracking-wider hover:bg-secondary/80 transition-colors"
                >
                  <CalendarDays size={14} /> VIEW SCHEDULE
                </button>
              )}

              {loadingProfile ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-secondary rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* ===== COACH PROFILE ===== */}
                  {user.role === "coach" && coachProfile && (
                    <>
                      {/* Bio & style */}
                      {coachProfile.bio && (
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1">BIO</p>
                          <p className="font-body text-sm text-foreground">{coachProfile.bio}</p>
                        </div>
                      )}

                      {/* Quick stats grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Experience", value: coachProfile.years_experience ? `${coachProfile.years_experience} yrs` : "—" },
                          { label: "Style", value: coachProfile.coaching_style || "—" },
                          { label: "Hand", value: coachProfile.dominant_hand || "—" },
                          { label: "Playtomic", value: coachProfile.playtomic_level ?? "—" },
                          { label: "Nationality", value: coachProfile.nationality || "—" },
                          { label: "Pref. Side", value: coachProfile.preferred_side || "—" },
                        ].map((item) => (
                          <div key={item.label} className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">{item.label}</p>
                            <p className="font-display text-foreground text-sm capitalize">{String(item.value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Languages */}
                      {coachProfile.languages && coachProfile.languages.length > 0 && (
                        <div>
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">LANGUAGES</p>
                          <div className="flex flex-wrap gap-1.5">
                            {coachProfile.languages.map((lang) => (
                              <span key={lang} className="px-2 py-1 rounded-md bg-secondary text-xs font-body text-foreground flex items-center gap-1">
                                <Globe size={10} className="text-muted-foreground" /> {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Specializations */}
                      {coachProfile.specializations && coachProfile.specializations.length > 0 && (
                        <div>
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">SPECIALIZATIONS</p>
                          <div className="flex flex-wrap gap-1.5">
                            {coachProfile.specializations.map((s) => (
                              <span key={s} className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs font-body flex items-center gap-1">
                                <Briefcase size={10} /> {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      {coachProfile.certifications && coachProfile.certifications.length > 0 && (
                        <div>
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">CERTIFICATIONS</p>
                          <div className="flex flex-wrap gap-1.5">
                            {coachProfile.certifications.map((c) => (
                              <span key={c} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-body flex items-center gap-1">
                                <Award size={10} /> {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Shot confidence */}
                      <div>
                        <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">PADEL STRENGTHS</p>
                        <ShotBars shots={coachShots} />
                      </div>

                      <BestWorstShots best={coachProfile.best_shot} weakest={coachProfile.weakest_shot} />

                      {/* Racket */}
                      {coachProfile.racket_brand && (
                        <div>
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">RACKET</p>
                          <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-display text-xs shrink-0">
                              {coachProfile.racket_brand.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display text-sm text-foreground truncate">{coachProfile.racket_brand} {coachProfile.racket_model || ""}</p>
                              <p className="text-[10px] font-body text-muted-foreground capitalize">{coachProfile.racket_type || "mixed"}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Playtomic link */}
                      {coachProfile.playtomic_url && (
                        <a
                          href={coachProfile.playtomic_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-body text-primary hover:underline"
                        >
                          View on Playtomic <ExternalLink size={14} />
                        </a>
                      )}
                    </>
                  )}

                  {user.role === "coach" && !coachProfile && (
                    <p className="font-body text-sm text-muted-foreground">No coach profile found.</p>
                  )}

                  {/* ===== PLAYER PROFILE ===== */}
                  {user.role === "player" && playerProfile && (
                    <>
                      {/* Upcoming schedule */}
                      <UpcomingSchedule playerId={user.user_id} linkPrefix="training" showCoach={true} daysAhead={21} />

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Hand", value: playerProfile.dominant_hand || "—" },
                          { label: "Fitness", value: playerProfile.fitness_level || "—" },
                          { label: "Years", value: playerProfile.years_playing ?? "—" },
                          { label: "Playtomic", value: playerProfile.playtomic_level ?? "—" },
                        ].map((item) => (
                          <div key={item.label} className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">{item.label}</p>
                            <p className="font-display text-foreground text-sm capitalize">{String(item.value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Court tendency */}
                      <div>
                        <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">COURT TENDENCY</p>
                        <div className="relative h-8 rounded-lg overflow-hidden flex">
                          <div
                            className="h-full flex items-center justify-center text-xs font-display"
                            style={{ width: `${playerProfile.left_tendency_pct ?? 50}%`, backgroundColor: "hsl(var(--primary))" }}
                          >
                            <span className="text-primary-foreground">{playerProfile.left_tendency_pct ?? 50}% L</span>
                          </div>
                          <div
                            className="h-full flex items-center justify-center text-xs font-display bg-secondary"
                            style={{ width: `${playerProfile.right_tendency_pct ?? 50}%` }}
                          >
                            <span className="text-muted-foreground">{playerProfile.right_tendency_pct ?? 50}% R</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">SHOT CONFIDENCE</p>
                        <ShotBars shots={playerShots} />
                      </div>

                      <BestWorstShots best={playerProfile.best_shot} weakest={playerProfile.weakest_shot} />

                      {rackets.length > 0 && (
                        <div>
                          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-2">RACKETS</p>
                          <div className="space-y-2">
                            {rackets.map((r) => (
                              <div key={r.id} className="bg-secondary/50 rounded-lg p-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-display text-xs shrink-0">
                                  {r.brand?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-display text-sm text-foreground truncate">{r.brand} {r.model}</p>
                                  <p className="text-[10px] font-body text-muted-foreground capitalize">{r.type || "mixed"}</p>
                                </div>
                                {r.is_favorite && <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {playerProfile.playtomic_url && (
                        <a
                          href={playerProfile.playtomic_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-body text-primary hover:underline"
                        >
                          View on Playtomic <ExternalLink size={14} />
                        </a>
                      )}
                    </>
                  )}

                  {user.role === "player" && !playerProfile && (
                    <p className="font-body text-sm text-muted-foreground">No player profile found.</p>
                  )}
                </>
              )}

              {/* Admin actions */}
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">ADMIN ACTIONS</p>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-body text-muted-foreground w-16">Role</label>
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(e.target.value as AppRole)}
                    className="flex-1 px-3 py-2 rounded-lg font-body text-xs uppercase tracking-wider border border-border cursor-pointer bg-secondary text-foreground"
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-body text-muted-foreground w-16">Status</label>
                  <button
                    onClick={toggleActive}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-body text-xs uppercase tracking-wider transition-colors ${
                      user.is_active
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    }`}
                  >
                    {user.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                    {user.is_active ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Message any user */}
                <button
                  onClick={handleMessage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-foreground font-display text-xs tracking-wider hover:bg-secondary/80 transition-colors"
                >
                  <MessageSquare size={14} />
                  SEND MESSAGE
                </button>

                <button
                  onClick={() => { onClose(); navigate("/admin/assignments"); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors"
                >
                  <Link2 size={14} />
                  CREATE ASSIGNMENT
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserDetailDrawer;
