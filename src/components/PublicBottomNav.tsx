import { Link, useLocation } from "react-router-dom";
import {
  Home, UserSearch, ShoppingBag, CalendarDays, UsersRound,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "HOME" },
  { to: "/find-a-coach", icon: UserSearch, label: "COACHES" },
  { to: "/marketplace", icon: ShoppingBag, label: "MARKET" },
  { to: "/events", icon: CalendarDays, label: "EVENTS" },
  { to: "/community", icon: UsersRound, label: "COMMUNITY" },
];

const PublicBottomNav = () => {
  const { pathname } = useLocation();

  return (
    <>
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon size={20} />
                <span className="font-display text-[9px] tracking-wider">{label}</span>
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
