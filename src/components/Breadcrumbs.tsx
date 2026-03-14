import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  "/": "Home",
  "/programs": "Programs",
  "/about": "About",
  "/beginner-camp": "Beginner Camp",
  "/advanced-camp": "Advanced Camp",
  "/pro-camp": "Pro Camp",
  "/tactical-masterclass": "Tactical Masterclass",
  "/partner-training": "Partner Training",
  "/play-with-pro": "Play with a Pro",
  "/crash-course": "Crash Course",
  "/one-shot-clinic": "One Shot Clinic",
  "/the-fixer": "The Fixer",
  "/video-deep-dive": "Video Deep Dive",
  "/weekend-warrior": "Weekend Warrior",
  "/pre-camp-assessment": "Pre-Camp Assessment",
};

const coursePages = [
  "/tactical-masterclass", "/partner-training", "/play-with-pro",
  "/crash-course", "/one-shot-clinic", "/the-fixer",
  "/video-deep-dive", "/weekend-warrior", "/pre-camp-assessment",
];

const campPages = ["/beginner-camp", "/advanced-camp", "/pro-camp"];

interface BreadcrumbsProps {
  variant?: "light" | "dark";
}

const Breadcrumbs = ({ variant = "dark" }: BreadcrumbsProps) => {
  const { pathname } = useLocation();

  if (pathname === "/") return null;

  const crumbs: { label: string; href?: string }[] = [{ label: "Home", href: "/" }];

  if (campPages.includes(pathname) || coursePages.includes(pathname)) {
    crumbs.push({ label: "Programs", href: "/programs" });
  }

  crumbs.push({ label: routeLabels[pathname] || pathname.replace("/", "").replace(/-/g, " ") });

  const textColor = variant === "light" ? "text-primary-foreground/70" : "text-muted-foreground";
  const activeColor = variant === "light" ? "text-primary-foreground" : "text-foreground";
  const hoverColor = variant === "light" ? "hover:text-primary-foreground" : "hover:text-primary";
  const chevronColor = variant === "light" ? "text-primary-foreground/40" : "text-muted-foreground/50";

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-body text-sm mb-4">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className={chevronColor} />}
          {crumb.href ? (
            <Link to={crumb.href} className={`${textColor} ${hoverColor} transition-colors`}>
              {crumb.label}
            </Link>
          ) : (
            <span className={`${activeColor} font-medium`}>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
