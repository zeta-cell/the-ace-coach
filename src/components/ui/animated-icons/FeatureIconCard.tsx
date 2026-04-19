import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { motion } from "framer-motion";

type IconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

type AnyIconProps = { size?: number; className?: string };

interface FeatureIconCardProps {
  Icon: ComponentType<AnyIconProps & { ref?: React.Ref<IconHandle> }>;
  title: string;
  description: ReactNode;
  index: number;
  /** Auto-loop the animation every N ms after mount. 0 disables. */
  autoLoopMs?: number;
}

/**
 * Wraps a Pqoqubbw-style animated icon in a card and bridges
 * the card's hover state to the icon's imperative animation API.
 * Also auto-loops the animation periodically so users see it
 * without needing to hover.
 */
export const FeatureIconCard = ({
  Icon,
  title,
  description,
  index,
  autoLoopMs = 3500,
}: FeatureIconCardProps) => {
  const iconRef = useRef<IconHandle>(null);
  const hoveringRef = useRef(false);

  useEffect(() => {
    if (!autoLoopMs) return;
    // Stagger so all 6 icons don't pulse in unison
    const initial = setTimeout(() => {
      iconRef.current?.startAnimation();
    }, 600 + index * 250);

    const interval = setInterval(() => {
      if (!hoveringRef.current) {
        iconRef.current?.startAnimation();
      }
    }, autoLoopMs + index * 150);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [autoLoopMs, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      onMouseEnter={() => {
        hoveringRef.current = true;
        iconRef.current?.startAnimation();
      }}
      onMouseLeave={() => {
        hoveringRef.current = false;
        iconRef.current?.stopAnimation();
      }}
      className="group bg-card/70 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 group-hover:scale-110 transition-all text-primary">
        <Icon ref={iconRef} size={32} />
      </div>
      <h3 className="font-display text-lg tracking-wider mb-2">{title}</h3>
      <p className="font-body text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};
