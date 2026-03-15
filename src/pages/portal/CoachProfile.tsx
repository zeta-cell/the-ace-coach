import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Camera, ExternalLink, Target, TrendingDown,
  Bell, BellOff, LogOut, Mail, Phone, Globe, Award, BookOpen, MessageCircle, Pencil, Plus
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PortalLayout from "@/components/portal/PortalLayout";
import CoachProfileEdit from "@/components/portal/CoachProfileEdit";
import CoachPackageCard, { type CoachPackage } from "@/components/portal/CoachPackageCard";
import CoachPackageDialog from "@/components/portal/CoachPackageDialog";

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
    const [{ data: coach }, { data: prof }, { data: pkgs }] = await Promise.all([
      supabase.from("coach_profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("profiles").select("notification_preferences").eq("user_id", user.id).single(),
      supabase.from("coach_packages").select("*").eq("coach_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (coach) setCoachData(coach as CoachData);
    if (prof?.notification_preferences) {
      setNotifPrefs(prof.notification_preferences as typeof notifPrefs);
    }
    if (pkgs) setPackages(pkgs as unknown as CoachPackage[]);
  };

  const toggleNotifPref = async (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    if (user) {
      await supabase.from("profiles").update({ notification_preferences: updated } as any).eq("user_id", user.id);
    }
  };

  const handleSavePkg = async (data: any) => {
    if (!user) return;
    setPkgSaving(true);
    try {
      if (editingPkg) {
        const { error } = await supabase.from("coach_packages").update(data as any).eq("id", editingPkg.id);
        if (error) throw error;
        toast({ title: "Package updated" });
      } else {
        const { error } = await supabase.from("coach_packages").insert({ ...data, coach_id: user.id } as any);
        if (error) throw error;
        toast({ title: "Package created" });
      }
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
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchData();
  };

  const handleTogglePkg = async (id: string, active: boolean) => {
    const { error } = await supabase.from("coach_packages").update({ is_active: active } as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchData();
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

        {/* Certifications, Languages, Specializations */}
        {(coachData?.certifications?.length || coachData?.languages?.length || coachData?.specializations?.length) ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-6 space-y-4">
            {coachData.certifications && coachData.certifications.length > 0 && (
              <div>
                <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Award size={14} /> CERTIFICATIONS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {coachData.certifications.map((c) => (
                    <span key={c} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body font-medium">{c}</span>
                  ))}
                </div>
              </div>
            )}
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
