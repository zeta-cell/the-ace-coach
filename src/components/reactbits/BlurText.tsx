// Adapted from React Bits (reactbits.dev) BlurText — one entrance, respects reduced motion
import { motion, useReducedMotion } from "motion/react";

interface Props { text: string; className?: string; delay?: number }

export default function BlurText({ text, className, delay = 0 }: Props) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block will-change-[transform,opacity,filter]"
          initial={reduce ? false : { opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.06 }}
        >
          {w}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}
