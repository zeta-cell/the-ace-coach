import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { CoachJoinInfo, fetchCoachJoinInfo, storePendingCoach, claimPendingCoach } from "@/lib/coachInvite";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Sparkles } from "lucide-react";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

/**
 * Public coach sign-up link: /join/:slug (slug or coach user id).
 * Anyone signing up here is instantly linked to the coach and lands in the
 * coach's CRM as a new lead.
 */
const CoachJoin = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<CoachJoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (slug) storePendingCoach(slug);
    (async () => {
      setCoach(await fetchCoachJoinInfo(slug));
      setLoading(false);
    })();
  }, [slug]);

  // Existing / new session (also after returning from Google / Apple) → link + go.
  useEffect(() => {
    const finish = async () => {
      await claimPendingCoach();
      navigate("/dashboard", { replace: true });
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) setTimeout(finish, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) finish();
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
        emailRedirectTo: `${window.location.origin}/join/${slug}`,
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
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError("");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/join/${slug}`,
    });
    if (result.error) setError(result.error.message || "Sign-in failed");
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-body text-muted-foreground">Loading…</div>;
  }

  if (!coach || !coach.is_valid) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl text-foreground mb-2">LINK NOT AVAILABLE</h1>
        <p className="font-body text-sm text-muted-foreground mb-6 max-w-sm">
          This coach link is not valid. Ask your coach for a new one.
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
            {coach.coach_avatar ? (
              <img src={coach.coach_avatar} alt={coach.coach_name || "Coach"} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center font-display text-primary">
                {(coach.coach_name || "C").charAt(0)}
              </div>
            )}
            <div>
              <p className="font-body text-xs text-muted-foreground">Join the squad of</p>
              <h1 className="font-display text-lg text-foreground tracking-wide">{coach.coach_name || "Your coach"}</h1>
            </div>
          </div>
          {coach.bio && <p className="font-body text-sm text-muted-foreground mb-3">{coach.bio}</p>}
          <div className="flex items-start gap-2 rounded-xl bg-primary/10 p-3">
            <Sparkles size={16} className="text-primary mt-0.5" />
            <p className="font-body text-sm text-foreground">
              Create your account to get your player card, shot assessments and training plans.
            </p>
          </div>
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
            {busy ? "CREATING ACCOUNT…" : "SIGN UP TO MY COACH"}
          </button>
        </form>

        <SocialAuthButtons onSelect={handleOAuth} className="mt-5" />

        <p className="flex items-center justify-center gap-1.5 font-body text-xs text-muted-foreground mt-5">
          <ShieldCheck size={14} /> You will be linked to {coach.coach_name || "your coach"} automatically.
        </p>
      </motion.div>
    </div>
  );
};

export default CoachJoin;
