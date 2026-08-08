import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { CoachInviteInfo, fetchInvite, storePendingInvite, claimPendingInvite } from "@/lib/coachInvite";
import { Eye, EyeOff, Sparkles, ShieldCheck, ArrowLeft, CalendarDays, Trophy, Lock } from "lucide-react";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

/**
 * Coach invite landing page: /invite/:token
 * The player only chooses email + password (or Google / Apple) and is
 * automatically linked to the coach who sent the link.
 */
const CoachInvite = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<CoachInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (token) storePendingInvite(token);
    (async () => {
      const data = await fetchInvite(token);
      setInvite(data);
      setFullName(data?.full_name || "");
      setEmail(data?.email || "");
      setLoading(false);
    })();
  }, [token]);

  // If a session already exists (e.g. after returning from Google/Apple), claim + continue.
  useEffect(() => {
    const proceed = async (userId: string) => {
      await claimPendingInvite();
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", userId)
        .maybeSingle();
      navigate(data?.onboarding_completed ? "/profile" : "/welcome", { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const uid = session.user.id;
        setTimeout(() => { proceed(uid); }, 0);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) await proceed(data.session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/invite/${token}`,
        data: { full_name: fullName || email.split("@")[0] },
      },
    });
    if (signUpError && /already registered/i.test(signUpError.message)) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (signInError) setError(signInError.message);
      return;
    }
    setBusy(false);
    if (signUpError) setError(signUpError.message);
    // Session (if returned) is picked up by the listener above.
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError("");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/invite/${token}`,
    });
    if (result.error) setError(result.error.message || "Sign-in failed");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-body text-muted-foreground">Loading your invite…</div>;
  }

  if (!invite || !invite.is_valid) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl text-foreground mb-2">INVITE NOT AVAILABLE</h1>
        <p className="font-body text-sm text-muted-foreground mb-6 max-w-sm">
          This invite link has already been used or has expired. Ask your coach for a new link.
        </p>
        <Link to="/login" className="font-display text-sm tracking-wider text-primary">GO TO LOGIN</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-body mb-6">
          <ArrowLeft size={16} /> Back to website
        </Link>

        <div className="bg-card border border-border rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-3 mb-4">
            {invite.coach_avatar ? (
              <img src={invite.coach_avatar} alt={invite.coach_name || "Coach"} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center font-display text-primary">
                {(invite.coach_name || "C").charAt(0)}
              </div>
            )}
            <div>
              <p className="font-body text-xs text-muted-foreground">Invited by your coach</p>
              <p className="font-display text-lg text-foreground tracking-wide">{invite.coach_name || "Your coach"}</p>
            </div>
          </div>
          {invite.has_assessment ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl bg-secondary p-3">
                  <p className="flex items-center gap-1 font-display text-[10px] tracking-wider text-muted-foreground">
                    <CalendarDays size={12} className="text-primary" /> ASSESSED
                  </p>
                  <p className="mt-1 font-display text-sm text-foreground">
                    {invite.assessment_date
                      ? new Date(invite.assessment_date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="flex items-center gap-1 font-display text-[10px] tracking-wider text-muted-foreground">
                    <Trophy size={12} className="text-primary" /> OVERALL LEVEL
                  </p>
                  <p className="mt-1 font-display text-sm text-foreground">
                    {invite.overall_level ?? "—"}
                    {invite.level_system ? <span className="ml-1 text-[10px] text-muted-foreground uppercase">{invite.level_system}</span> : null}
                  </p>
                </div>
              </div>

              {/* Blurred teaser — real values unlock after the password is set */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/60 p-3">
                <div className="space-y-2 blur-[5px] select-none" aria-hidden="true">
                  {["Volley", "Forehand", "Serve", "Smash", "Backhand", "Lob", "Bandeja", "Víbora"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="w-20 font-body text-[11px] text-foreground">{s}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-border">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${45 + ((i * 7) % 45)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-card/40">
                  <Lock size={16} className="text-primary" />
                  <p className="font-display text-[11px] tracking-wider text-foreground">
                    SET A PASSWORD TO UNLOCK
                  </p>
                </div>
              </div>
              <p className="mt-3 font-body text-xs text-muted-foreground">
                Your 8-shot breakdown, coach notes and development curves are waiting inside
                {invite.sport ? ` (${invite.sport})` : ""}.
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3">
                <Sparkles size={16} className="text-primary mt-0.5" />
                <p className="font-body text-sm text-foreground">
                  You trained with {invite.coach_name || "your coach"} on court — now it moves into the app.
                  Set a password and your coach can publish your personal assessment: 8 shot scores,
                  notes and your development over time.
                </p>
              </div>
              <ol className="space-y-1.5 font-body text-xs text-muted-foreground">
                <li>1. Set a password below (email is already filled in).</li>
                <li>2. Add a photo, your name and your goals — takes a minute.</li>
                <li>3. Your player card and assessment open right after.</li>
              </ol>
            </div>
          )}
        </div>



        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm font-body rounded-lg p-3 mb-4">{error}</div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">FULL NAME</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">EMAIL</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block font-display text-xs tracking-wider text-muted-foreground mb-1.5">PASSWORD</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-card border border-border rounded-lg px-4 py-3 pr-10 text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Min. 8 characters"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground font-display text-sm tracking-wider py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {busy ? "CREATING ACCOUNT…" : "SEE MY ASSESSMENT"}
          </button>
        </form>

        <SocialAuthButtons onSelect={handleOAuth} className="mt-5" />

        <p className="flex items-center justify-center gap-1.5 font-body text-xs text-muted-foreground mt-5">
          <ShieldCheck size={14} /> You will be linked to {invite.coach_name || "your coach"} automatically.
        </p>
      </motion.div>
    </div>
  );
};

export default CoachInvite;
