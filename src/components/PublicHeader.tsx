import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { List as Menu, X, Sun, Moon, Globe } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { BrandLogo } from "@/components/BrandLogo";

const roleHome: Record<string, string> = {
  player: "/dashboard",
  coach: "/coach",
  club_manager: "/club",
  admin: "/founders",
};

const PublicHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(
    typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const location = useLocation();
  const { t, lang, setLang } = useI18n();
  const { user, role } = useAuth();
  const { isEnabled, isComingSoon } = useFeatureFlags();
  const isLoggedIn = !!user;
  const portalHref = role ? roleHome[role] || "/dashboard" : "/login";

  // Every public nav entry is controlled from /admin/features.
  // `public_nav` is the master switch for the discovery links.
  // Disabled links stay visible with a "SOON" badge so the menu never looks empty.
  const showDiscovery = isEnabled("public_nav");
  const NAV_LINKS = [
    { label: t("nav.find"), href: "/find-a-coach", flag: "coach_discovery", visible: showDiscovery },
    { label: t("nav.marketplace"), href: "/marketplace", flag: "marketplace", visible: showDiscovery },
    { label: t("nav.events"), href: "/events", flag: "events", visible: showDiscovery },
    { label: t("nav.community"), href: "/community", flag: "community", visible: showDiscovery },
    { label: "FOR CLUBS", href: "/login", flag: "club_signup", visible: true },
  ].map((l) => ({ ...l, active: isEnabled(l.flag), soon: isComingSoon(l.flag) })).filter((l) => l.visible);


  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  const toggleLang = () => setLang(lang === "en" ? "es" : "en");

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="flex items-center">
              <BrandLogo className="h-5" />
            </Link>
          </div>


          <Link to="/" className="hidden md:flex items-center shrink-0">
            <BrandLogo className="h-7" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              link.active ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`font-display text-xs tracking-wider transition-colors ${
                    location.pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <span
                  key={link.href}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap font-display text-xs tracking-wider text-muted-foreground/40 cursor-not-allowed"
                >
                  {link.label}
                  <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 font-display text-[8px] tracking-wider text-primary">
                    SOON
                  </span>
                </span>
              )
            ))}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={toggleLang}
              aria-label="Switch language"
              className="flex items-center gap-1 px-1.5 py-1 md:px-2 md:py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Globe size={14} className="md:hidden" />
              <Globe size={16} className="hidden md:block" />
              <span className="font-display text-[10px] md:text-xs tracking-wider uppercase">{lang}</span>
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 md:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? <Sun size={16} className="md:hidden" /> : <Moon size={16} className="md:hidden" />}
              {theme === "dark" ? <Sun size={18} className="hidden md:block" /> : <Moon size={18} className="hidden md:block" />}
            </button>
            {!isLoggedIn && (
              <Link to={portalHref} className="font-display text-[10px] md:text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 md:px-0">
                <span className="md:hidden">{t("home.cta.coach")}</span>
                <span className="hidden md:inline">{t("nav.login")}</span>
              </Link>
            )}
            <Link to={portalHref} className="font-display text-xs md:text-sm tracking-wider bg-primary text-primary-foreground px-3 py-1.5 md:px-5 md:py-2 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap">
              {isLoggedIn ? t("nav.account") : (
                <>
                  <span className="hidden md:inline">{t("nav.getStarted")}</span>
                  <span className="md:hidden">{t("nav.login")}</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-0 top-14 z-50 md:hidden"
          >
            <div className="absolute inset-0 bg-background/80" onClick={() => setMenuOpen(false)} />
            <div className="relative w-64 h-full bg-card border-r border-border p-4 space-y-1">
              <div className="p-3 mb-4 border-b border-border">
                <BrandLogo className="h-6" />

              </div>
              {NAV_LINKS.map(link => (
                link.active ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg font-display text-sm tracking-wider transition-colors ${
                      location.pathname === link.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <div
                    key={link.href}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg font-display text-xs tracking-wider text-muted-foreground/40 whitespace-nowrap"
                  >
                    {link.label}
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 font-display text-[8px] tracking-wider text-primary">
                      SOON
                    </span>
                  </div>
                )
              ))}
              <button
                onClick={() => { toggleLang(); setMenuOpen(false); }}
                className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg font-display text-sm tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <Globe size={16} /> {lang === "en" ? "ESPAÑOL" : "ENGLISH"}
              </button>
              <div className="pt-4 border-t border-border mt-4">
                <Link
                  to={portalHref}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg font-display text-sm tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {isLoggedIn ? t("nav.account") : t("nav.login")}
                </Link>
                <Link
                  to={portalHref}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 mt-1 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider text-center"
                >
                  {isLoggedIn ? t("nav.account") : t("nav.getStarted")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PublicHeader;
