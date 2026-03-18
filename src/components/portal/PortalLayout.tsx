import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, BookOpen, Video,
  MessageSquare, User, LogOut, Menu, X, ChevronLeft, ChevronRight,
  Users, Settings, Home, CreditCard, Link2, CalendarDays, UserCheck, Search, ShoppingBag, Eye, Dumbbell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/portal/NotificationBell";
import QuickAddTrainingDrawer from "@/components/portal/QuickAddTrainingDrawer";

const playerNav = [
  { label: "Find a Coach", icon: Search, href: "/find-a-coach" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Events", icon: CalendarDays, href: "/events" },
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "My Programs", icon: BookOpen, href: "/dashboard#programs" },
  { label: "Training", icon: Calendar, href: "/training" },
  { label: "Videos", icon: Video, href: "/videos" },
  { label: "Messages", icon: MessageSquare, href: "/messages" },
  { label: "Rewards", icon: CreditCard, href: "/rewards" },
];

const coachNav = [
  { label: "Training Center", icon: LayoutDashboard, href: "/coach" },
  { label: "Players", icon: Users, href: "/coach/players" },
  { label: "Library", icon: BookOpen, href: "/coach/library" },
  { label: "Videos", icon: Video, href: "/coach/videos" },
  { label: "Calendar", icon: CalendarDays, href: "/coach/calendar" },
  { label: "Events", icon: Calendar, href: "/coach/events" },
  { label: "Marketplace", icon: ShoppingBag, href: "/coach/marketplace" },
  { label: "Requests", icon: UserCheck, href: "/coach" },
  { label: "Messages", icon: MessageSquare, href: "/coach/messages" },
];

const adminNav = [
  { label: "Command Center", icon: LayoutDashboard, href: "/admin" },
  { label: "Players", icon: Users, href: "/admin/users?role=player" },
  { label: "Coaches", icon: UserCheck, href: "/admin/users?role=coach" },
  { label: "Assignments", icon: Link2, href: "/admin/assignments" },
  { label: "Library", icon: BookOpen, href: "/admin/library" },
  { label: "Marketplace", icon: ShoppingBag, href: "/admin/marketplace" },
  { label: "Events", icon: Calendar, href: "/admin/events" },
  { label: "Payments", icon: CreditCard, href: "/admin/payments" },
  { label: "Schedule", icon: CalendarDays, href: "/admin/schedule" },
  { label: "Founders", icon: Eye, href: "/founders" },
];

const PortalLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fabDrawerOpen, setFabDrawerOpen] = useState(false);

  const navItems = role === "admin" ? adminNav : role === "coach" ? coachNav : playerNav;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-display text-sm text-primary-foreground">CA</div>
        {sidebarOpen && <span className="font-display text-lg text-foreground tracking-wide">PORTAL</span>}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const [itemPath, itemSearch] = item.href.split("?");
          const isActive = itemSearch
            ? location.pathname === itemPath && location.search === `?${itemSearch}`
            : location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-body uppercase tracking-wide text-xs">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        {profile && sidebarOpen && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
        >
          <LogOut size={20} />
          {sidebarOpen && <span className="font-body uppercase tracking-wide text-xs">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 relative ${sidebarOpen ? "w-60" : "w-16"}`}>
        <NavContent />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors z-10"
        >
          {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          {role === "coach" ? (
            <>
              {/* Left two: Players, Calendar */}
              {[
                { label: "Players", icon: Users, href: "/coach/players" },
                { label: "Calendar", icon: CalendarDays, href: "/coach/calendar" },
              ].map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    <item.icon size={20} />
                    <span className="text-[10px] font-body font-medium">{item.label}</span>
                  </Link>
                );
              })}
              {/* Center — Create Plan */}
              <button onClick={() => setFabDrawerOpen(true)} className="flex flex-col items-center -mt-5">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                  <Dumbbell size={22} />
                </div>
                <span className="text-[9px] font-display tracking-wider text-primary mt-1">CREATE</span>
              </button>
              {/* Right two: Library, Messages */}
              {[
                { label: "Library", icon: BookOpen, href: "/coach/library" },
                { label: "Messages", icon: MessageSquare, href: "/coach/messages" },
              ].map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    <item.icon size={20} />
                    <span className="text-[10px] font-body font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          ) : (
            (role === "player" ? playerNav.slice(0, 5) : navItems.slice(0, 5)).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  <item.icon size={20} />
                  <span className="text-[10px] font-body font-medium">{item.label}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 md:px-6 h-14 flex items-center justify-between">
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link to={role === "coach" ? "/coach/profile" : "/profile"}>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile slide-out menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-0 top-14 z-50 md:hidden"
            >
              <div className="absolute inset-0 bg-background/80" onClick={() => setMobileOpen(false)} />
              <div className="relative w-64 h-full bg-card border-r border-border">
                <NavContent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Coach QuickAdd Drawer (triggered from bottom nav) */}
      {role === "coach" && (
        <QuickAddTrainingDrawer
          open={fabDrawerOpen}
          onClose={() => setFabDrawerOpen(false)}
        />
      )}
    </div>
  );
};

export default PortalLayout;
