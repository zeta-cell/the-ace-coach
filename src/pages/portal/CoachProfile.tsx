import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Camera, ExternalLink, Target, TrendingDown,
  Bell, BellOff, LogOut, Mail, Phone, Globe, Award, BookOpen, MessageCircle, Pencil, Plus,
  Copy, ExternalLink as ExtLink, Link2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PortalLayout from "@/components/portal/PortalLayout";
import CoachProfileEdit from "@/components/portal/CoachProfileEdit";
import CoachPackageCard, { type CoachPackage } from "@/components/portal/CoachPackageCard";
import CoachPackageDialog from "@/components/portal/CoachPackageDialog";
import { Trash2 } from "lucide-react";

interface Certification {
  id: string;
  name: string;
  issuing_body: string | null;
  year_obtained: number | null;
  certificate_url: string | null;
}

interface CoachData {
  bio: string | null;
  coaching_style: string | null;
  certifications: string[];
  languages: string[];
  specializations: string[];
  years_experience: number | null;
  nationality: string | null;
  phone: string | null;
  dominant_hand: string | null;
  preferred_side: string | null;
  playtomic_level: number | null;
  playtomic_url: string | null;
  racket_brand: string | null;
  racket_model: string | null;
  racket_type: string | null;
  volley_pct: number;
  forehand_pct: number;
  serve_pct: number;
  smash_pct: number;
  backhand_pct: number;
  lob_pct: number;
  best_shot: string | null;
  weakest_shot: string | null;
  profile_slug: string | null;
  location_city: string | null;
  location_country: string | null;
  response_time_hours: number;
  hourly_rate_from: number | null;
  is_verified: boolean;
  badge_level: string;
  total_sessions_coached: number;
  primary_sport: string | null;
}

const CoachProfile = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [packages, setPackages] = useState<CoachPackage[]>([]);
  const [pkgDialogOpen, setPkgDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CoachPackage | null>(null);
  const [pkgSaving, setPkgSaving] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [certForm, setCertForm] = useState({ name: "", issuing_body: "", year_obtained: "", certificate_url: "" });
  const [showCertForm, setShowCertForm] = useState(false);
  const [certSaving, setCertSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    new_message: true,
    coach_feedback: true,
    new_plan: true,
    plan_reminder: true,
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: coach }, { data: prof }, { data: pkgs }, { data: certs }] = await Promise.all([
      supabase.from("coach_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("profiles").select("notification_preferences").eq("user_id", user.id).single(),
      supabase.from("coach_packages").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }),
      supabase.from("coach_certifications").select("*").eq("coach_id", user.id).order("year_obtained", { ascending: false }),
    ]);
    if (coach) setCoachData(coach as unknown as CoachData);
    if (prof?.notification_preferences) {
      setNotifPrefs(prof.notification_preferences as typeof notifPrefs);
    }
    if (pkgs) setPackages(pkgs as unknown as CoachPackage[]);
    if (certs) setCertifications(certs as unknown as Certification[]);
  };

  const toggleNotifPref = async (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    if (user) {
      await supabase.from("profiles").update({ notification_preferences: updated } as any).eq("user_id", user.id);
    }
  };

  const syncHourlyRate = async () => {
    if (!user) return;
    const { data: minPkg } = await supabase
      .from('coach_packages')
      .select('price_per_session')
      .eq('coach_id', user.id)
      .eq('is_active', true)
      .order('price_per_session', { ascending: true })
      .limit(1)
      .maybeSingle();
    await supabase
      .from('coach_profiles')
      .update({ hourly_rate_from: minPkg?.price_per_session ?? null })
      .eq('user_id', user.id);
  };

  const handleSavePkg = async (data: any) => {
    if (!user) return;
    setPkgSaving(true);
    try {
      if (editingPkg) {
        const { error } = await supabase.from("coach_packages").update(data).eq("id", editingPkg.id);
        if (error) throw error;
        toast({ title: "Package updated" });
      } else {
        const { error } = await supabase.from("coach_packages").insert({ ...data, coach_id: user.id });
        if (error) throw error;
        toast({ title: "Package created" });
      }
      await syncHourlyRate();
      setPkgDialogOpen(false);
      setEditingPkg(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPkgSaving(false);
    }
  };

  const handleDeletePkg = async (id: string) => {
    const { error } = await supabase.from("coach_packages").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await syncHourlyRate();
      fetchData();
    }
  };

  const handleTogglePkg = async (id: string, active: boolean) => {
    const { error } = await supabase.from("coach_packages").update({ is_active: active }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await syncHourlyRate();
      fetchData();
    }
  };

  const handleAddCert = async () => {
    if (!user || !certForm.name.trim()) return;
    setCertSaving(true);
    const { error } = await supabase.from("coach_certifications").insert({
      coach_id: user.id,
      name: certForm.name.trim(),
      issuing_body: certForm.issuing_body.trim() || null,
      year_obtained: certForm.year_obtained ? parseInt(certForm.year_obtained) : null,
      certificate_url: certForm.certificate_url.trim() || null,
    } as any);
    setCertSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCertForm({ name: "", issuing_body: "", year_obtained: "", certificate_url: "" });
      setShowCertForm(false);
      fetchData();
    }
  };

  const handleDeleteCert = async (id: string) => {
    const { error } = await supabase.from("coach_certifications").delete().eq("id", id);
    if (!error) fetchData();
  };

  const copyProfileUrl = () => {
    if (coachData?.profile_slug) {
      navigator.clipboard.writeText(`${window.location.origin}/coach/${coachData.profile_slug}`);
      toast({ title: "Link copied!" });
    }
  };

  const shots = coachData
    ? [
        { name: "Volley", pct: coachData.volley_pct },
        { name: "Forehand", pct: coachData.forehand_pct },
        { name: "Serve", pct: coachData.serve_pct },
        { name: "Smash", pct: coachData.smash_pct },
        { name: "Backhand", pct: coachData.backhand_pct },
        { name: "Lob", pct: coachData.lob_pct },
      ].sort((a, b) => b.pct - a.pct)
    : [];

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Identity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div />
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-display tracking-wider hover:bg-secondary/80 transition-colors"
            >
              <Pencil size={12} /> EDIT
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-3xl text-primary">
                    {profile?.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5">
                <Camera size={12} className="text-primary-foreground" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl text-foreground">{profile?.full_name?.toUpperCase()}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {coachData?.primary_sport && (
                  <span className="font-body text-[10px] bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full uppercase font-semibold">
                    {coachData.primary_sport === "padel" ? "Padel" : "Tennis"} Coach
                  </span>
                )}
                {coachData?.nationality && (
                  <span className="font-body text-xs text-muted-foreground">{coachData.nationality}</span>
                )}
                {coachData?.years_experience != null && coachData.years_experience > 0 && (
                  <span className="font-body text-xs text-muted-foreground">{coachData.years_experience}y experience</span>
                )}
                {coachData?.dominant_hand && (
                  <span className="font-body text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-semibold">
                    {coachData.dominant_hand} hand
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            {profile?.email && (
              <div className="flex items-center gap-2 text-sm font-body text-foreground">
                <Mail size={14} className="text-muted-foreground shrink-0" />
                <span>{profile.email}</span>
              </div>
            )}
            {coachData?.phone && (
              <div className="flex items-center gap-2 text-sm font-body text-foreground">
                <Phone size={14} className="text-muted-foreground shrink-0" />
                <span>{coachData.phone}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Public profile link info box */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={14} className="text-primary shrink-0" />
            <span className="font-display text-xs tracking-wider text-muted-foreground">PUBLIC PROFILE</span>
          </div>
          {coachData?.profile_slug ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-body text-sm text-foreground">/coach/{coachData.profile_slug}</span>
              <button
                onClick={copyProfileUrl}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-foreground text-[10px] font-display tracking-wider hover:bg-secondary/80 transition-colors"
              >
                <Copy size={10} /> COPY
              </button>
              <a
                href={`/coach/${coachData.profile_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-display tracking-wider hover:bg-primary/20 transition-colors"
              >
                <ExternalLink size={10} /> OPEN
              </a>
            </div>
          ) : (
            <p className="font-body text-xs text-muted-foreground">
              Set your profile URL in Edit Profile to get a shareable link
            </p>
          )}
        </motion.div>

        {/* Bio & Style */}
        {(coachData?.bio || coachData?.coaching_style) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">ABOUT</h2>
            {coachData.bio && <p className="font-body text-sm text-foreground mb-3">{coachData.bio}</p>}
            {coachData.coaching_style && (
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-muted-foreground shrink-0" />
                <span className="font-body text-sm text-muted-foreground">Style: {coachData.coaching_style}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Certifications (from coach_certifications table) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
              <Award size={14} /> CERTIFICATIONS
            </h2>
            <button
              onClick={() => setShowCertForm(!showCertForm)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display tracking-wider hover:bg-primary/90 transition-colors"
            >
              <Plus size={12} /> ADD
            </button>
          </div>

          {showCertForm && (
            <div className="mb-4 p-4 rounded-lg bg-secondary space-y-3">
              <input
                placeholder="Certification name (e.g. ITF Level 2)"
                value={certForm.name}
                onChange={e => setCertForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                placeholder="Issuing body (e.g. International Tennis Federation)"
                value={certForm.issuing_body}
                onChange={e => setCertForm(p => ({ ...p, issuing_body: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Year (e.g. 2022)"
                  value={certForm.year_obtained}
                  onChange={e => setCertForm(p => ({ ...p, year_obtained: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  placeholder="Certificate URL (optional)"
                  value={certForm.certificate_url}
                  onChange={e => setCertForm(p => ({ ...p, certificate_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCert}
                  disabled={certSaving || !certForm.name.trim()}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display tracking-wider disabled:opacity-50"
                >
                  {certSaving ? "SAVING…" : "SAVE CERTIFICATION"}
                </button>
                <button
                  onClick={() => setShowCertForm(false)}
                  className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-xs font-display tracking-wider"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {certifications.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-4">No certifications yet</p>
          ) : (
            <div className="space-y-2">
              {certifications.map(cert => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={14} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-body text-sm text-foreground font-medium truncate">{cert.name}</p>
                      <p className="font-body text-[10px] text-muted-foreground">
                        {[cert.issuing_body, cert.year_obtained].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteCert(cert.id)} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Languages, Specializations */}
        {(coachData?.languages?.length || coachData?.specializations?.length) ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-6 space-y-4">
            {coachData.languages && coachData.languages.length > 0 && (
              <div>
                <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Globe size={14} /> LANGUAGES
                </h3>
                <div className="flex flex-wrap gap-2">
                  {coachData.languages.map((l) => (
                    <span key={l} className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-body font-medium">{l}</span>
                  ))}
                </div>
              </div>
            )}
            {coachData.specializations && coachData.specializations.length > 0 && (
              <div>
                <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-2">SPECIALIZATIONS</h3>
                <div className="flex flex-wrap gap-2">
                  {coachData.specializations.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs font-body font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}

        {/* Playtomic */}
        {(coachData?.playtomic_level || coachData?.playtomic_url) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">PLAYTOMIC</h2>
            <div className="flex items-center justify-between">
              {coachData.playtomic_level && <span className="font-display text-4xl text-foreground">{coachData.playtomic_level}</span>}
              {coachData.playtomic_url && (
                <a href={coachData.playtomic_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary font-body text-sm hover:underline">
                  View profile <ExternalLink size={14} />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* My Packages */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground">MY PACKAGES</h2>
            <button
              onClick={() => { setEditingPkg(null); setPkgDialogOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display tracking-wider hover:bg-primary/90 transition-colors"
            >
              <Plus size={12} /> CREATE
            </button>
          </div>
          {packages.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-8">No packages yet. Create your first coaching package!</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {packages.map((pkg) => (
                <CoachPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onEdit={(p) => { setEditingPkg(p); setPkgDialogOpen(true); }}
                  onDelete={handleDeletePkg}
                  onToggleActive={handleTogglePkg}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Shot confidence */}
        {coachData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">PLAY STYLE</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-secondary rounded-lg p-4 text-center">
                <Target size={24} className="text-primary mx-auto mb-2" />
                <p className="font-display text-lg text-foreground">{coachData.best_shot || "—"}</p>
                <p className="text-[10px] font-body text-muted-foreground uppercase">Best Shot</p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <TrendingDown size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="font-display text-lg text-foreground">{coachData.weakest_shot || "—"}</p>
                <p className="text-[10px] font-body text-muted-foreground uppercase">Weakest Shot</p>
              </div>
            </div>
            <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3">SHOT CONFIDENCE</h3>
            <div className="space-y-3">
              {shots.map((shot, i) => (
                <div key={shot.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-body text-foreground">{shot.name}</span>
                    <span className="text-sm font-body font-semibold text-foreground">{shot.pct}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${i < 2 ? "bg-primary" : "bg-muted-foreground/30"}`}
                      style={{ width: `${shot.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Racket */}
        {coachData?.racket_brand && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-3">MY RACKET</h2>
            <div className="flex items-center gap-3 bg-secondary rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center font-display text-sm text-foreground">
                {coachData.racket_brand.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-body text-sm font-medium text-foreground">{coachData.racket_model}</p>
                <p className="text-xs font-body text-muted-foreground">{coachData.racket_brand} · {coachData.racket_type}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notification Preferences */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-display text-sm tracking-wider text-muted-foreground mb-4">NOTIFICATION SETTINGS</h2>
          <div className="space-y-3">
            {([
              { key: "new_message" as const, label: "New Messages", desc: "When you receive a new message" },
              { key: "coach_feedback" as const, label: "Player Updates", desc: "When a player completes training" },
              { key: "new_plan" as const, label: "Plan Reminders", desc: "Reminders for upcoming plans" },
            ]).map((pref) => (
              <button
                key={pref.key}
                onClick={() => toggleNotifPref(pref.key)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="text-left">
                  <p className="font-body text-sm text-foreground">{pref.label}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{pref.desc}</p>
                </div>
                {notifPrefs[pref.key] ? (
                  <Bell size={18} className="text-primary shrink-0" />
                ) : (
                  <BellOff size={18} className="text-muted-foreground shrink-0" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <button
            onClick={signOut}
            className="w-full py-3 rounded-xl border border-destructive/30 text-destructive font-display text-sm tracking-widest hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            SIGN OUT
          </button>
        </motion.div>

        {coachData && (
          <CoachProfileEdit
            open={editOpen}
            onClose={() => setEditOpen(false)}
            coachData={coachData}
            onSaved={fetchData}
          />
        )}

        <CoachPackageDialog
          open={pkgDialogOpen}
          onClose={() => { setPkgDialogOpen(false); setEditingPkg(null); }}
          onSave={handleSavePkg}
          editing={editingPkg}
          saving={pkgSaving}
        />
      </div>
    </PortalLayout>
  );
};

export default CoachProfile;
