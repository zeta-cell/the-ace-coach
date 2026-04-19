import { Link, useLocation } from "react-router-dom";
import {
  Home, Calendar, CalendarDays, Users, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/lib/i18n";

const PublicBottomNav = () => {
  const { pathname } = useLocation();
  const { user, role } = useAuth();
  const { t } = useI18n();
  const isPlayer = !!user && role === "player";

  const NAV_ITEMS = [
    { to: "/", icon: Home, label: t("bn.home"), playerTo: "/dashboard" },
    { to: "/training", icon: Calendar, label: t("bn.training"), playerTo: "/training" },
    { to: "/events", icon: CalendarDays, label: t("bn.events"), playerTo: "/events" },
    { to: "/community", icon: Users, label: t("bn.community"), playerTo: "/community" },
    { to: "/messages", icon: MessageSquare, label: t("bn.messages"), playerTo: "/messages" },
  ];

  return (
    <>
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map(({ to, icon: Icon, label, playerTo }) => {
            const href = isPlayer ? playerTo : to;
            const active = pathname === href || (href !== "/" && href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={label}
                to={href}
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
