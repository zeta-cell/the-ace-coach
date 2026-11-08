// Adapted from React Bits (reactbits.dev) CountUp — tweens a number when it scrolls into view
import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

interface Props { to: number; decimals?: number; suffix?: string; className?: string }

export default function CountUp({ to, decimals = 0, suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (!inView || reduce) { el.textContent = fmt(inView || reduce ? to : 0); return; }
    const c = animate(0, to, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (el.textContent = fmt(v)) });
    return () => c.stop();
  }, [inView, reduce, to, decimals, suffix]);
  return <span ref={ref} className={`tabular-nums ${className ?? ""}`} />;
}
