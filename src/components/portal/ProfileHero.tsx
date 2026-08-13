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
  avatarUploadUserId,
  onAvatarUploaded,
  square,
  children,
  className,
}: ProfileHeroProps) => {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const shownAvatar = localUrl || avatarUrl;
  const canUpload = Boolean(avatarUploadUserId);

  const handleFile = async (file: File) => {
    if (!avatarUploadUserId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large", { description: "Please use a photo under 8 MB." });
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${avatarUploadUserId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", avatarUploadUserId);
      if (dbErr) throw dbErr;
      setLocalUrl(url);
      onAvatarUploaded?.(url);
      toast.success("Profile photo updated");
    } catch (err) {
      console.error("Avatar upload failed", err);
      toast.error("Couldn't upload photo", { description: "Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const triggerAvatar = () => {
    if (canUpload) fileRef.current?.click();
    else onAvatarClick?.();
  };


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
            <button
              type="button"
              onClick={triggerAvatar}
              disabled={!canUpload && !onAvatarClick}
              aria-label="Change profile photo"
              className={cn(
                "group relative flex h-24 w-24 items-center justify-center overflow-hidden border-4 border-card bg-secondary sm:h-28 sm:w-28",
                square ? "rounded-2xl" : "rounded-full",
                (canUpload || onAvatarClick) && "cursor-pointer",
              )}
            >
              {shownAvatar ? (
                <img src={shownAvatar} alt={name || ""} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-4xl text-primary">{initial}</span>
              )}
              {(canUpload || onAvatarClick) && (
                <span className="absolute inset-0 hidden items-center justify-center bg-foreground/45 sm:group-hover:flex">
                  <Camera size={20} className="text-background" />
                </span>
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/55">
                  <Loader2 size={22} className="animate-spin text-background" />
                </span>
              )}
            </button>
            {(canUpload || onAvatarClick) && (
              <button
                type="button"
                onClick={triggerAvatar}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-primary shadow-lg transition-transform active:scale-95"
              >
                {uploading ? (
                  <Loader2 size={18} className="animate-spin text-primary-foreground" />
                ) : (
                  <Camera size={18} className="text-primary-foreground" />
                )}
              </button>
            )}
            {canUpload && (
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
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
