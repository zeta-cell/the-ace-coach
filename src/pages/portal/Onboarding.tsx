import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Star, ChevronRight, ChevronLeft } from "lucide-react";

const GOALS_OPTIONS = [
  "Improve volleys", "Improve serve", "Footwork", "Fitness",
  "Tournament prep", "Mental game", "Technique", "Tactics", "General fun",
];

const NATIONALITIES = [
  "Spain", "Germany", "France", "UK", "USA", "Netherlands", "Sweden",
  "Italy", "Argentina", "Brazil", "Mexico", "Poland", "Portugal", "Other",
];

interface Racket {
  brand: string;
  model: string;
  type: "power" | "control" | "mixed";
  is_favorite: boolean;
}

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 1
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [dominantHand, setDominantHand] = useState<"left" | "right" | "">("");

  // Step 2
  const [yearsPlaying, setYearsPlaying] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState<string>("");
  const [goals, setGoals] = useState<string[]>([]);

  // Step 3
  const [leftTendency, setLeftTendency] = useState(50);
  const [volley, setVolley] = useState(50);
  const [forehand, setForehand] = useState(50);
  const [serve, setServe] = useState(50);
  const [smash, setSmash] = useState(50);
  const [backhand, setBackhand] = useState(50);
  const [lob, setLob] = useState(50);

  // Step 4
  const [playtomicUrl, setPlaytomicUrl] = useState("");
  const [playtomicLevel, setPlaytomicLevel] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [rackets, setRackets] = useState<Racket[]>([
    { brand: "", model: "", type: "mixed", is_favorite: true },
  ]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const addRacket = () => {
    if (rackets.length < 5) {
      setRackets([...rackets, { brand: "", model: "", type: "mixed", is_favorite: false }]);
    }
  };

  const updateRacket = (index: number, field: keyof Racket, value: string | boolean) => {
    const updated = [...rackets];
    (updated[index] as any)[field] = value;
    if (field === "is_favorite" && value === true) {
      updated.forEach((r, i) => { if (i !== index) r.is_favorite = false; });
    }
    setRackets(updated);
  };

  const removeRacket = (index: number) => {
    const updated = rackets.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((r) => r.is_favorite)) {
      updated[0].is_favorite = true;
    }
    setRackets(updated);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Upload avatar if selected
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }

      // Update profile
      await supabase.from("profiles").update({
        avatar_url: avatarUrl,
        onboarding_completed: true,
      }).eq("user_id", user.id);

      // Compute best and weakest shots
      const shotMap = {
        Volley: volley,
        Forehand: forehand,
        Serve: serve,
        Smash: smash,
        Backhand: backhand,
        Lob: lob,
      };
      const sortedShots = Object.entries(shotMap).sort((a, b) => b[1] - a[1]);
      const bestShot = sortedShots[0][0];
      const weakestShot = sortedShots[sortedShots.length - 1][0];

      // Update player profile
      await supabase.from("player_profiles").update({
        date_of_birth: dateOfBirth || null,
        nationality: nationality || null,
        dominant_hand: (dominantHand || null) as "left" | "right" | null,
        years_playing: yearsPlaying,
        fitness_level: (fitnessLevel || null) as "beginner" | "intermediate" | "advanced" | "elite" | null,
        goals,
        playtomic_url: playtomicUrl || null,
        playtomic_level: playtomicLevel ? parseFloat(playtomicLevel) : null,
        left_tendency_pct: leftTendency,
        right_tendency_pct: 100 - leftTendency,
        volley_pct: volley,
        forehand_pct: forehand,
        serve_pct: serve,
        smash_pct: smash,
        backhand_pct: backhand,
        lob_pct: lob,
        best_shot: bestShot,
        weakest_shot: weakestShot,
      }).eq("user_id", user.id);

      // Insert rackets
      const validRackets = rackets.filter((r) => r.brand && r.model);
      if (validRackets.length > 0) {
        await supabase.from("player_rackets").insert(
          validRackets.map((r) => ({
            player_id: user.id,
            brand: r.brand,
            model: r.model,
            type: r.type,
            is_favorite: r.is_favorite,
          }))
        );
      }

      // Referral code redemption
      if (referralCode.trim()) {
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('referral_code', referralCode.trim().toLowerCase())
          .maybeSingle();

        if (referrerProfile && referrerProfile.user_id !== user.id) {
          // Create referral record
          await supabase.from('referrals').insert({
            referrer_id: referrerProfile.user_id,
            referred_id: user.id,
            referral_code: referralCode.trim().toLowerCase(),
            status: 'signed_up',
            signup_reward_paid: true,
          });
          // Credit referrer €5 wallet credit
          await supabase.rpc('credit_wallet', {
            p_user_id: referrerProfile.user_id,
            p_amount: 5,
            p_type: 'credit_referral',
            p_description: 'Friend signed up with your referral code',
            p_reference_id: user.id,
          });
          // Award referrer 100 XP
          await supabase.rpc('award_xp', {
            p_user_id: referrerProfile.user_id,
            p_amount: 100,
            p_event_type: 'referral_signup',
            p_description: 'A friend signed up using your referral code',
          });
          // Notify referrer
          await supabase.from('notifications').insert({
            user_id: referrerProfile.user_id,
            title: 'A friend joined ACE!',
            body: 'Someone signed up using your referral code. You earned €5 wallet credit!',
            link: '/dashboard',
          });
        }
      }

      await refreshProfile();
      navigate("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return dominantHand !== "";
    if (step === 2) return fitnessLevel !== "";
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <label className="cursor-pointer group">
                <div className="w-24 h-24 rounded-full bg-card border-2 border-border group-hover:border-primary transition-colors flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={28} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
              <p className="text-xs text-muted-foreground mt-2 font-body">Tap to upload photo</p>
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">DATE OF BIRTH</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">NATIONALITY</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select nationality</option>
                {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-3">DOMINANT HAND</label>
              <div className="grid grid-cols-2 gap-3">
                {(["left", "right"] as const).map((hand) => (
                  <button
                    key={hand}
                    type="button"
                    onClick={() => setDominantHand(hand)}
                    className={`py-4 rounded-xl font-display text-lg tracking-wider border-2 transition-all ${
                      dominantHand === hand
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {hand.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-3">YEARS PLAYING PADEL</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setYearsPlaying(Math.max(0, yearsPlaying - 1))}
                  className="w-10 h-10 rounded-lg bg-card border border-border text-foreground font-display text-lg flex items-center justify-center hover:border-primary transition-colors"
                >
                  −
                </button>
                <span className="font-display text-3xl text-foreground w-12 text-center">{yearsPlaying}</span>
                <button
                  type="button"
                  onClick={() => setYearsPlaying(yearsPlaying + 1)}
                  className="w-10 h-10 rounded-lg bg-card border border-border text-foreground font-display text-lg flex items-center justify-center hover:border-primary transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-3">FITNESS LEVEL</label>
              <div className="grid grid-cols-2 gap-3">
                {(["beginner", "intermediate", "advanced", "elite"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFitnessLevel(level)}
                    className={`py-3 rounded-xl font-display text-sm tracking-wider border-2 transition-all ${
                      fitnessLevel === level
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {level.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-3">TRAINING GOALS</label>
              <div className="flex flex-wrap gap-2">
                {GOALS_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all ${
                      goals.includes(goal)
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-3">SIDE PREFERENCE</label>
              {/* Visual bar */}
              <div className="h-10 rounded-full overflow-hidden flex mb-2">
                <div
                  className="bg-primary flex items-center justify-start pl-3 transition-all"
                  style={{ width: `${Math.max(leftTendency, 15)}%` }}
                >
                  <span className="text-xs font-body font-semibold text-primary-foreground whitespace-nowrap">
                    Left {leftTendency}%
                  </span>
                </div>
                <div
                  className="bg-muted flex-1 flex items-center justify-end pr-3"
                >
                  <span className="text-xs font-body font-semibold text-muted-foreground whitespace-nowrap">
                    Right {100 - leftTendency}%
                  </span>
                </div>
              </div>
              {/* Range slider */}
              <input
                type="range"
                min={0}
                max={100}
                value={leftTendency}
                onChange={(e) => setLeftTendency(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-primary
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-foreground"
              />
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-3">SHOT CONFIDENCE</label>
              <p className="text-xs text-muted-foreground font-body mb-4">
                Your coach will review and adjust these after your first session.
              </p>
              {[
                { label: "Volley", value: volley, set: setVolley },
                { label: "Forehand", value: forehand, set: setForehand },
                { label: "Serve", value: serve, set: setServe },
                { label: "Smash", value: smash, set: setSmash },
                { label: "Backhand", value: backhand, set: setBackhand },
                { label: "Lob", value: lob, set: setLob },
              ].map((shot) => (
                <div key={shot.label} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-body text-foreground">{shot.label}</span>
                    <span className="text-sm font-body font-semibold text-foreground">{shot.value}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={shot.value}
                    onChange={(e) => shot.set(parseInt(e.target.value))}
                    className="w-full h-2 bg-card rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">REFERRAL CODE (OPTIONAL)</label>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                placeholder="Enter a friend's referral code"
              />
              <p className="text-xs text-muted-foreground mt-1 font-body">Were you referred by a friend?</p>
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">PLAYTOMIC PROFILE</label>
              <input
                type="url"
                value={playtomicUrl}
                onChange={(e) => setPlaytomicUrl(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                placeholder="https://playtomic.io/user/..."
              />
              <p className="text-xs text-muted-foreground mt-1 font-body">
                We'll display this as a verified link on your profile
              </p>
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">YOUR CURRENT LEVEL</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={playtomicLevel}
                onChange={(e) => setPlaytomicLevel(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                placeholder="e.g. 4.5"
              />
            </div>

            <div>
              <label className="block font-display text-xs tracking-wider text-muted-foreground mb-3">MY RACKETS</label>
              {rackets.map((racket, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-xs tracking-wider text-muted-foreground">
                      RACKET {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateRacket(index, "is_favorite", true)}
                        className={`p-1 rounded ${racket.is_favorite ? "text-primary" : "text-muted-foreground"}`}
                      >
                        <Star size={16} fill={racket.is_favorite ? "currentColor" : "none"} />
                      </button>
                      {rackets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRacket(index)}
                          className="text-muted-foreground hover:text-destructive text-xs font-body"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      value={racket.brand}
                      onChange={(e) => updateRacket(index, "brand", e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                      placeholder="Brand"
                    />
                    <input
                      value={racket.model}
                      onChange={(e) => updateRacket(index, "model", e.target.value)}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                      placeholder="Model"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["power", "control", "mixed"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateRacket(index, "type", type)}
                        className={`py-2 rounded-lg font-display text-xs tracking-wider border transition-all ${
                          racket.type === type
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {rackets.length < 5 && (
                <button
                  type="button"
                  onClick={addRacket}
                  className="flex items-center gap-2 text-primary font-body text-sm font-medium hover:text-primary/80 transition-colors"
                >
                  <Plus size={16} /> Add another racket
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-xs tracking-wider text-muted-foreground">
              STEP {step} OF 4
            </span>
            <span className="font-display text-xs tracking-wider text-muted-foreground">
              {step === 1 ? "BASIC INFO" : step === 2 ? "PLAYING BACKGROUND" : step === 3 ? "PLAY STYLE" : "GEAR & PLAYTOMIC"}
            </span>
          </div>
          <div className="h-1.5 bg-card rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border px-4 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-display text-sm tracking-wider hover:bg-secondary transition-colors"
            >
              <ChevronLeft size={16} /> BACK
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              NEXT <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "SAVING..." : "COMPLETE SETUP"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
