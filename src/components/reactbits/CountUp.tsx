// Adapted from React Bits (reactbits.dev) CountUp — tweens a number when it scrolls into view.
// One tween per value change, always starting from the number already on screen, so late-arriving
// data eases up to its real value instead of jumping. Never runs when the OS asks for reduced motion.
import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

interface Props {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function CountUp({ to, decimals = 0, prefix = "", suffix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const shown = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = Number.isFinite(to) ? to : 0;
    const fmt = (v: number) =>
      prefix +
      v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) +
      suffix;

    if (!inView) {
      el.textContent = fmt(shown.current);
      return;
    }
    const from = shown.current;
    if (reduce || from === target) {
      shown.current = target;
      el.textContent = fmt(target);
      return;
    }
    const controls = animate(from, target, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = fmt(v);
      },
      onComplete: () => {
        shown.current = target;
        el.textContent = fmt(target);
      },
    });
    return () => controls.stop();
  }, [inView, reduce, to, decimals, prefix, suffix]);

  return <span ref={ref} className={`tabular-nums ${className ?? ""}`} />;
}
