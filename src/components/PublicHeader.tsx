import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

const PublicHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(
    typeof window !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const location = useLocation();
  const { t, lang, setLang } = useI18n();

  const NAV_LINKS = [
    { label: t("nav.find"), href: "/find-a-coach" },
    { label: t("nav.marketplace"), href: "/marketplace" },
    { label: t("nav.events"), href: "/events" },
    { label: t("nav.community"), href: "/community" },
  ];

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
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="hidden md:flex items-center gap-1.5 font-display text-2xl tracking-wider text-foreground shrink-0">
            <span className="text-primary">Hi</span>
            <span>Volley</span>
            <span className="inline-block w-2 h-2 rounded-full bg-mustard" aria-hidden />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-display text-xs tracking-wider transition-colors ${
                  location.pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
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
            <Link to="/login" className="font-display text-[10px] md:text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 md:px-0">
              <span className="md:hidden">{t("home.cta.coach")}</span>
              <span className="hidden md:inline">{t("nav.login")}</span>
            </Link>
            <Link to="/login" className="font-display text-xs md:text-sm tracking-wider bg-primary text-primary-foreground px-3 py-1.5 md:px-5 md:py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <span className="hidden md:inline">{t("nav.getStarted")}</span>
              <span className="md:hidden">{t("nav.login")}</span>
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
                <span className="font-display text-xl tracking-wider text-foreground inline-flex items-center gap-1.5">
                  <span className="text-primary">Hi</span>
                  <span>Volley</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-mustard" aria-hidden />
                </span>
              </div>
              {NAV_LINKS.map(link => (
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
              ))}
              <button
                onClick={() => { toggleLang(); setMenuOpen(false); }}
                className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg font-display text-sm tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <Globe size={16} /> {lang === "en" ? "ESPAÑOL" : "ENGLISH"}
              </button>
              <div className="pt-4 border-t border-border mt-4">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg font-display text-sm tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 mt-1 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider text-center"
                >
                  {t("nav.getStarted")}
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
