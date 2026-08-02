import { useMemo, useRef, useState } from "react";
import { Download, Star } from "lucide-react";
import { SHOT_KEYS } from "@/lib/assessments";
import { LEVEL_CONFIG } from "@/lib/gamification";
import { toast } from "sonner";

interface Props {
  name: string;
  avatarUrl?: string | null;
  level?: string;
  xp?: number;
  sport?: string;
  overallLevel?: number | null;
  shots: Record<string, number | null | undefined>;
  city?: string | null;
  cardNumber?: string;
  downloadable?: boolean;
}

/** Deterministic star field so the card looks identical on every render. */
const useStars = (seedKey: string, count: number) =>
  useMemo(() => {
    let seed = 0;
    for (let i = 0; i < seedKey.length; i++) seed = (seed * 31 + seedKey.charCodeAt(i)) % 100000;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    return Array.from({ length: count }, () => ({
      top: rnd() * 100,
      left: rnd() * 100,
      size: 0.6 + rnd() * 1.8,
      opacity: 0.25 + rnd() * 0.7,
    }));
  }, [seedKey, count]);

const CosmicPlayerCard = ({
  name,
  avatarUrl,
  level = "bronze",
  xp = 0,
  sport = "padel",
  overallLevel,
  shots,
  city,
  cardNumber,
  downloadable = true,
}: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const stars = useStars(name || "player", 70);
  const lvl = LEVEL_CONFIG[level] || LEVEL_CONFIG.bronze;

  const values = SHOT_KEYS.filter((s) => shots?.[s.key] != null).map((s) => ({
    label: s.label,
    value: Number(shots?.[s.key]) || 0,
  }));
  const overall = Math.round(values.reduce((a, b) => a + b.value, 0) / values.length);
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-player-card.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Player card downloaded");
    } catch (err: any) {
      toast.error("Could not export card", { description: err?.message });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className="relative mx-auto w-full max-w-[340px] aspect-[3/4.2] overflow-hidden rounded-[26px] p-[2px]"
        style={{
          background:
            "conic-gradient(from 140deg, hsl(25 95% 58%), hsl(265 85% 62%), hsl(199 90% 55%), hsl(25 95% 58%))",
        }}
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-[24px]"
          style={{
            background:
              "radial-gradient(120% 90% at 15% 5%, hsl(265 60% 22%) 0%, hsl(230 62% 12%) 45%, hsl(228 70% 6%) 100%)",
          }}
        >
          {/* Star field */}
          {stars.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                opacity: s.opacity,
              }}
            />
          ))}

          {/* Planets */}
          <div
            className="absolute -right-12 -top-10 h-40 w-40 rounded-full opacity-80"
            style={{ background: "radial-gradient(circle at 30% 30%, hsl(25 95% 62%), hsl(15 80% 35%) 70%)" }}
          />
          <div
            className="absolute -right-6 top-2 h-24 w-56 rounded-full border border-white/25"
            style={{ transform: "rotate(-24deg)" }}
          />
          <div
            className="absolute -left-14 bottom-16 h-28 w-28 rounded-full opacity-60"
            style={{ background: "radial-gradient(circle at 35% 30%, hsl(199 90% 65%), hsl(230 70% 25%) 75%)" }}
          />
          {/* Nebula glow */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: "linear-gradient(to top, hsl(228 80% 4% / 0.95), transparent)" }}
          />

          {/* Content */}
          <div className="relative flex h-full flex-col p-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-[10px] tracking-[0.25em] text-white/60">HI VOLLEY</p>
                <p className="font-display text-[9px] tracking-[0.2em] text-white/40 uppercase">
                  {sport} · cosmic series
                </p>
              </div>
              <div
                className="flex flex-col items-center rounded-xl px-2 py-1"
                style={{ background: `${lvl.color}22`, border: `1px solid ${lvl.color}66` }}
              >
                <span className="font-display text-lg leading-none" style={{ color: lvl.color }}>
                  {overall}
                </span>
                <span className="font-display text-[7px] tracking-widest" style={{ color: lvl.color }}>
                  OVR
                </span>
              </div>
            </div>

            {/* Portrait */}
            <div className="relative mt-3 flex flex-1 items-center justify-center">
              <div
                className="absolute h-40 w-40 rounded-full blur-2xl opacity-50"
                style={{ background: `radial-gradient(circle, ${lvl.color}, transparent 70%)` }}
              />
              {avatarUrl && !imgFailed ? (
                <img
                  src={avatarUrl}
                  alt={`${name} player card portrait`}
                  crossOrigin="anonymous"
                  onError={() => setImgFailed(true)}
                  className="relative h-36 w-36 rounded-full object-cover"
                  style={{ border: `2px solid ${lvl.color}` }}
                />
              ) : (
                <div
                  className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/5 font-display text-4xl text-white"
                  style={{ border: `2px solid ${lvl.color}` }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Name */}
            <div className="relative mt-1 text-center">
              <p className="font-display text-xl leading-tight text-white uppercase tracking-wide">{name}</p>
              <p className="font-body text-[10px] text-white/55">
                {city ? `${city} · ` : ""}
                {lvl.label.toUpperCase()}
                {overallLevel != null ? ` · LVL ${overallLevel}` : ""}
              </p>
            </div>

            {/* Stats grid */}
            <div className={`relative mt-3 grid gap-x-3 gap-y-1.5 ${values.length > 6 ? "grid-cols-4" : "grid-cols-3"} rounded-xl bg-white/[0.06] p-3 backdrop-blur-sm`}>
              {values.map((v) => (
                <div key={v.label} className="text-center">
                  <p className="font-display text-sm text-white leading-none">{v.value}</p>
                  <p className="font-body text-[8px] uppercase tracking-wider text-white/50">{v.label}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="relative mt-2 flex items-center justify-between">
              <span className="flex items-center gap-1 font-body text-[8px] tracking-wider text-white/40">
                <Star size={8} className="text-white/60" /> {xp.toLocaleString()} XP
              </span>
              <span className="font-body text-[8px] tracking-wider text-white/40">
                {cardNumber || "No. 001"} / COSMIC
              </span>
            </div>
          </div>
        </div>
      </div>

      {downloadable && (
        <button
          onClick={download}
          disabled={busy}
          className="mx-auto flex items-center gap-2 rounded-xl border border-border px-4 py-2 font-display text-[10px] tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
        >
          <Download size={12} /> {busy ? "RENDERING…" : "DOWNLOAD CARD"}
        </button>
      )}
    </div>
  );
};

export default CosmicPlayerCard;
