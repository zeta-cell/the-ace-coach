import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/contexts/AuthContext";

/** Blocks a route when its feature flag is off. Admins always pass through. */
export const FeatureRoute = ({
  feature,
  children,
  fallback = "/dashboard",
}: {
  feature: string;
  children: ReactNode;
  fallback?: string;
}) => {
  const { isEnabled, loading } = useFeatureFlags();
  const { role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isEnabled(feature) && role !== "admin") {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

/** Greyed-out "coming soon" wrapper for sections we keep visible but disabled. */
export const ComingSoonOverlay = ({
  title = "Coming soon",
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <div className="relative rounded-2xl overflow-hidden">
    <div className="pointer-events-none select-none opacity-30 saturate-0 blur-[1px]">{children}</div>
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-[2px] text-center px-6">
      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
        <Lock size={18} className="text-primary" />
      </div>
      <p className="font-display text-sm tracking-wider text-foreground uppercase">{title}</p>
      {subtitle && <p className="font-body text-xs text-muted-foreground max-w-xs">{subtitle}</p>}
    </div>
  </div>
);

export const ComingSoonBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-display text-[9px] tracking-wider text-primary">
    <Sparkles size={9} /> SOON
  </span>
);

export default FeatureRoute;
