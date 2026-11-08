// Adapted from React Bits (reactbits.dev) SpotlightCard — soft coral light follows the pointer
import { useRef, type ReactNode } from "react";

export default function SpotlightRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
      className="group relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(240px circle at var(--x) var(--y), hsl(var(--coral) / 0.12), transparent 70%)" }}
      />
      <div className={`relative ${className}`}>{children}</div>
    </div>
  );
}
