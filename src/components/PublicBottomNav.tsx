import { Link, useLocation } from "react-router-dom";
import {
  Search, ShoppingBag, CalendarDays, Home, BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_ITEMS = [
  { to: "/find-a-coach", icon: Search, label: "Find a Coach" },
  { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { to: "/events", icon: CalendarDays, label: "Events" },
  { to: "/", icon: Home, label: "Home" },
  { to: "/community", icon: BookOpen, label: "Community" },
];

const PLAYER_ITEMS = [
  { to: "/find-a-coach", icon: Search, label: "Find a Coach" },
  { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { to: "/events", icon: CalendarDays, label: "Events" },
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/dashboard#programs", icon: BookOpen, label: "My Programs" },
];

const PublicBottomNav = () => {
  const { pathname } = useLocation();
  const { user, role } = useAuth();

  const items = user && role === "player" ? PLAYER_ITEMS : PUBLIC_ITEMS;

  return (
    <>
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {items.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== "/" && to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon size={20} />
                <span className="font-display text-[9px] tracking-wider">{label.toUpperCase()}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="md:hidden h-14" />
    </>
  );
};

export default PublicBottomNav;
