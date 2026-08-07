import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/** Consistent portal section card: icon + title, optional action, soft surface. */
const SectionCard = ({ title, icon, action, subtitle, children, className }: SectionCardProps) => (
  <section className={cn("rounded-2xl border border-border bg-card p-5 sm:p-6", className)}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-sm tracking-wider text-foreground">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-1 font-body text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export default SectionCard;
