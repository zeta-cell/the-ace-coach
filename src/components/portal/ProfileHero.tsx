import { useRef, useState, type ReactNode } from "react";
import { Camera, Pencil, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";


export interface HeroChip {
  label: string;
  tone?: "primary" | "mustard" | "neutral";
}

export interface HeroStat {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

interface ProfileHeroProps {
  name?: string | null;
  avatarUrl?: string | null;
  /** Small line above the name, e.g. "PADEL COACH" or "MY ACADEMY" */
  eyebrow?: string;
  /** Line under the name, e.g. city · country */
  meta?: string | null;
  chips?: HeroChip[];
  stats?: HeroStat[];
  verified?: boolean;
  onEdit?: () => void;
  onAvatarClick?: () => void;
  /** When set, tapping the avatar opens a file picker and uploads to the avatars bucket */
  avatarUploadUserId?: string | null;
  /** Called after a successful avatar upload */
  onAvatarUploaded?: (url: string) => void;

  /** Rounded square avatar instead of circle — used for academies/clubs */
  square?: boolean;
  children?: ReactNode;
  className?: string;
}

const chipTone: Record<NonNullable<HeroChip["tone"]>, string> = {
  primary: "bg-primary/15 text-primary border-primary/25",
  mustard: "bg-mustard-soft text-mustard border-mustard/30",
  neutral: "bg-background/60 text-foreground border-border",
};

/**
 * Shared premium profile header used by player, coach and academy pages.
 * Purely presentational — layered gradient cover, court-line motif, avatar,
 * identity chips and a stat strip. Extra content goes in `children`.
 */
const ProfileHero = ({
  name,
  avatarUrl,
  eyebrow,
  meta,
  chips = [],
  stats = [],
  verified,
  onEdit,
  onAvatarClick,
  square,
  children,
  className,
}: ProfileHeroProps) => {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg",
        className,
      )}
    >
      {/* Cover */}
      <div className="relative h-32 sm:h-40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-mustard" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--background)/0.5),transparent_55%)]" />
        {/* court lines motif */}
        <svg
          className="absolute inset-0 h-full w-full text-primary-foreground/25"
          viewBox="0 0 400 160"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 118 H400" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M60 160 L150 40 H400" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M200 160 V40" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="330" cy="46" r="26" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>

        {onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 font-display text-[10px] tracking-wider text-foreground backdrop-blur-md transition-colors hover:bg-background"
          >
            <Pencil size={11} /> EDIT
          </button>
        )}
      </div>

      {/* Identity */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
          <div className="relative shrink-0">
            <div
              className={cn(
                "flex h-24 w-24 items-center justify-center overflow-hidden border-4 border-card bg-secondary sm:h-28 sm:w-28",
                square ? "rounded-2xl" : "rounded-full",
              )}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name || ""} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-4xl text-primary">{initial}</span>
              )}
            </div>
            {onAvatarClick && (
              <button
                onClick={onAvatarClick}
                aria-label="Change photo"
                className="absolute bottom-1 right-1 rounded-full bg-primary p-1.5 shadow-md"
              >
                <Camera size={12} className="text-primary-foreground" />
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            {eyebrow && (
              <p className="font-display text-[10px] tracking-[0.2em] text-primary">{eyebrow}</p>
            )}
            <h1 className="flex items-center gap-2 truncate font-display text-xl text-foreground sm:text-2xl">
              {name?.toUpperCase()}
              {verified && <CheckCircle2 size={16} className="shrink-0 text-primary" />}
            </h1>
            {meta && <p className="truncate font-body text-xs text-muted-foreground">{meta}</p>}
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span
                key={c.label}
                className={cn(
                  "rounded-full border px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-wide",
                  chipTone[c.tone || "neutral"],
                )}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}

        {stats.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border/70 bg-secondary/60 p-3 text-center"
              >
                {s.icon && <div className="mb-1 flex justify-center">{s.icon}</div>}
                <p className="font-display text-lg leading-none text-foreground">{s.value}</p>
                <p className="mt-1 font-body text-[9px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

export default ProfileHero;
