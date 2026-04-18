import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "FIND A COACH", href: "/find-a-coach" },
  { label: "MARKETPLACE", href: "/marketplace" },
  { label: "EVENTS", href: "/events" },
  { label: "COMMUNITY", href: "/community" },
];

const PublicHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Mobile: burger menu */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop: ACE logo + nav links */}
          <Link to="/" className="hidden md:block font-display text-2xl tracking-wider text-foreground shrink-0">
            ACE<span className="text-primary"> Coach</span>
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
          <div className="flex items-center gap-3">
            <Link to="/login" className="font-display text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors hidden md:block">LOG IN</Link>
            <Link to="/login" className="font-display text-sm tracking-wider bg-primary text-primary-foreground px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <span className="hidden md:inline">GET STARTED</span>
              <span className="md:hidden text-xs">LOG IN</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out menu */}
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
                <span className="font-display text-xl tracking-wider text-foreground">
                  ACE<span className="text-primary"> Coach</span>
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
              <div className="pt-4 border-t border-border mt-4">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg font-display text-sm tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  LOG IN
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 mt-1 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider text-center"
                >
                  GET STARTED
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
