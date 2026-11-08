// Adapted from React Bits (reactbits.dev) SpotlightCard — a soft coral light follows the pointer
// inside a card. The light lives between the card's own background and its content, so text stays
// fully readable. Only appears on hover, on tiles the pointer is actually over.
import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Radius of the light in px. */
  radius?: number;
  /** Strength of the light, 0–1. */
  strength?: number;
}

export default function SpotlightCard({
  children,
  className,
  style,
  radius = 220,
  strength = 0.1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sb-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--sb-y", `${e.clientY - r.top}px`);
      }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      style={style}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${radius}px circle at var(--sb-x, 50%) var(--sb-y, 50%), hsl(var(--coral) / ${strength}), transparent 70%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
