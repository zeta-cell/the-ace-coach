import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link2, Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";

/**
 * The coach's permanent public sign-up link. Anyone who signs up through it
 * (email, Google or Apple) is instantly linked to the coach and appears in
 * their CRM as a new lead.
 */
const CoachSignupLinkCard = () => {
  const { user } = useAuth();
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("profile_slug")
        .eq("user_id", user.id)
        .maybeSingle();
      setSlug(data?.profile_slug || user.id);
    })();
  }, [user]);

  if (!slug) return null;
  const url = `${window.location.origin}/join/${slug}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Your sign-up link is copied");
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sign up to my coaching", url });
        return;
      } catch {
        /* cancelled */
      }
    }
    copy();
  };

  return (
    <div className="mb-6 rounded-2xl border border-primary/30 bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <Link2 size={16} className="text-primary" />
        <h2 className="font-display text-sm tracking-wider text-foreground">MY SIGN-UP LINK</h2>
      </div>
      <p className="mb-3 font-body text-xs text-muted-foreground">
        Share this link with your players. They sign up with email, Google or Apple and land
        straight in your CRM — ready for their assessment.
      </p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-secondary px-3 py-2 font-body text-xs text-foreground">
          {url}
        </code>
        <button onClick={copy} className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20" title="Copy link">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <button onClick={share} className="shrink-0 rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90" title="Share link">
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default CoachSignupLinkCard;
