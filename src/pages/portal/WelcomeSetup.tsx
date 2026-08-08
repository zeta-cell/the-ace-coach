import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Camera, Check, ChevronLeft, ChevronRight, Sparkles, Target, User } from "lucide-react";

const GOALS_OPTIONS = [
  "Improve volleys",
  "Improve serve",
  "Bandeja & víbora",
  "Footwork",
  "Fitness",
  "Tournament prep",
  "Mental game",
  "Technique",
  "Tactics",
  "Just have fun",
];

/**
 * Short 3-step setup shown right after a player sets their password from a coach
 * invite: photo, name, goals. Everything else stays optional in the profile.
 */
const WelcomeSetup = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [coachName, setCoachName] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name && !fullName) setFullName(profile.full_name);
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("coach_player_assignments")
        .select("coach_id")
        .eq("player_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data?.coach_id) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", data.coach_id)
        .maybeSingle();
      setCoachName(p?.full_name ?? null);
    })();
  }, [user]);

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please choose an image under 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const toggleGoal = (g: string) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const finish = async () => {
    if (!user) return;
    const name = fullName.trim();
    if (name.length < 2) {
      toast.error("Please enter your full name");
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = (avatarFile.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${user.id}/avatar.${ext}`;
        await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      const update: Record<string, unknown> = {
        full_name: name.slice(0, 100),
        onboarding_completed: true,
      };
      if (avatarUrl) update.avatar_url = avatarUrl;
      await supabase.from("profiles").update(update).eq("user_id", user.id);

      if (goals.length) {
        await supabase.from("player_profiles").update({ goals }).eq("user_id", user.id);
      }

      await refreshProfile();
      navigate("/profile", { replace: true });
    } catch (err) {
      console.error("Welcome setup failed", err);
      toast.error("Couldn't save your details", { description: "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 flex items-start gap-2 rounded-2xl bg-primary/10 p-4">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="font-display text-sm tracking-wide text-foreground">
              WELCOME{coachName ? ` — ${coachName.toUpperCase()} IS WAITING` : ""}
            </p>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Three quick things so your coach knows who's who: a photo, your name and what you want to
              work on. Your assessment and player card open right after.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-secondary"}`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          {step === 1 && (
            <div className="text-center">
              <p className="font-display text-sm tracking-wider text-foreground">PROFILE PHOTO</p>
              <p className="mt-1 font-body text-sm text-muted-foreground">
                So your coach recognises you from the court.
              </p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mx-auto mt-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-secondary text-muted-foreground hover:border-primary hover:text-primary"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Your profile photo" className="h-full w-full object-cover" />
                ) : (
                  <Camera size={26} />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={pickAvatar}
                className="hidden"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground">
                <User size={13} className="text-primary" /> FULL NAME
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
                placeholder="e.g. Maria Lopez"
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-3 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-2 font-body text-xs text-muted-foreground">
                Use the name your coach knows you by — that's how you appear in their player list.
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="flex items-center gap-1.5 font-display text-xs tracking-wider text-muted-foreground">
                <Target size={13} className="text-primary" /> WHAT DO YOU WANT TO IMPROVE?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {GOALS_OPTIONS.map((g) => {
                  const on = goals.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleGoal(g)}
                      className={`rounded-full border px-3 py-2 font-body text-xs transition-colors ${
                        on
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {on && <Check size={12} className="mr-1 inline text-primary" />}
                      {g}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 font-body text-xs text-muted-foreground">
                Your coach sees these when planning your sessions. You can add rackets, clubs and courts
                later in your profile.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 font-display text-xs tracking-wider text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={15} /> BACK
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-3 font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90"
            >
              CONTINUE <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-3 font-display text-xs tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "SAVING…" : "OPEN MY PLAYER CARD"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeSetup;
