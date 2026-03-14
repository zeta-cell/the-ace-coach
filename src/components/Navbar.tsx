import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, ArrowRight, LogIn, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import aceLogo from "@/assets/the-ace-logo.svg";
import aceIconRed from "@/assets/the-ace-icon-red.png";
import heroBg from "@/assets/hero-bg.jpeg";
import courseAdvanced from "@/assets/course-advanced.jpeg";
import aboutBg from "@/assets/about-bg.jpeg";
import campBeginner from "@/assets/course-beginner.jpeg";
import campAdvancedImg from "@/assets/camp-advanced.jpg";
import campPro from "@/assets/camp-pro.jpg";
import campAssessment from "@/assets/course-assessment.jpeg";
import campPartner from "@/assets/course-partner.jpeg";
import courseMastermind from "@/assets/course-mastermind.jpeg";
import courseTactical from "@/assets/course-tactical.jpeg";
import courseCrash from "@/assets/course-crash.jpeg";
import coursePrivate from "@/assets/course-private.jpeg";
import courseVideo from "@/assets/course-video.jpeg";
import courseWeekend from "@/assets/course-weekend.jpeg";
import courseOneshot from "@/assets/course-oneshot.jpeg";

const desktopMegaCamps = [
  { title: "Beginner Camp", subtitle: "The First Serve", tag: "5 Days", price: "649€", link: "/beginner-camp", image: campBeginner },
  { title: "Advanced Camp", subtitle: "The Improver", tag: "5 Days", price: "749€", link: "/advanced-camp", image: campAdvancedImg },
  { title: "Pro Camp", subtitle: "High-Intensity", tag: "5 Days", price: "849€", link: "/pro-camp", image: campPro },
  { title: "The Mastermind", subtitle: "Strategy Camp", tag: "5 Days", price: "749€", link: "/tactical-masterclass", image: courseMastermind },
  { title: "Partner Training", subtitle: "Train & Think Together", tag: "1 Week", price: "649€", link: "/partner-training", image: campPartner },
];

const desktopMegaCourses = [
  { title: "Play with the Pro", subtitle: "Live Tactical Coaching", tag: "Custom", price: "129€", link: "/play-with-pro", image: courseTactical },
  { title: "Crash Course", subtitle: "3-Day Intensive", tag: "3 Days", price: "349€", link: "/crash-course", image: courseCrash },
  { title: "One Shot Clinic", subtitle: "High-Repetition Clinic", tag: "1 Day", price: "59€", link: "/one-shot-clinic", image: courseOneshot },
  { title: "The Fixer", subtitle: "Private 1-on-1 Coaching", tag: "Custom", price: "59€", link: "/the-fixer", image: coursePrivate },
  { title: "Video Deep Dive", subtitle: "Shot Analysis", tag: "Custom", price: "99€", link: "/video-deep-dive", image: courseVideo },
  { title: "Weekend Warrior", subtitle: "3 Days of Padel", tag: "3 Days", price: "399€", link: "/weekend-warrior", image: courseWeekend },
  { title: "Pre-Camp Assessment", subtitle: "Check & Plan", tag: "1 Session", price: "49€", link: "/pre-camp-assessment", image: campAssessment },
];

const PulsingDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
  </span>
);

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [desktopMega, setDesktopMega] = useState(false);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const { t } = useLanguage();
  const { user, role } = useAuth();

  const desktopNavItems = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.programs, href: "/programs" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  const megaMenuTiles = [
    { label: t.megaMenu.padelPrograms, subtitle: t.megaMenu.joinNow, href: "/programs", image: heroBg, size: "large" as const, border: "border-[hsl(0,90%,45%)]" },
    { label: t.megaMenu.aceMethodology, subtitle: t.megaMenu.method, href: "/about", image: courseAdvanced, size: "medium" as const, border: "" },
    { label: t.megaMenu.coursesTraining, subtitle: t.megaMenu.courses, href: "/programs", image: courseTactical, size: "medium" as const, border: "" },
  ];

  const campTiles = [
    { label: t.megaMenu.beginner, href: "/beginner-camp", image: campBeginner },
    { label: t.megaMenu.advanced, href: "/advanced-camp", image: campAdvancedImg },
    { label: t.megaMenu.pro, href: "/pro-camp", image: campPro },
    { label: t.megaMenu.partner, href: "/partner-training", image: campPartner },
  ];

  const megaMenuLinks = [
    { label: t.nav.aboutUs, href: "/about" },
    { label: t.nav.valencia, href: "/about" },
    { label: t.nav.contact, href: "/contact" },
  ];

  const openMega = () => {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setDesktopMega(true);
  };
  const closeMega = () => {
    megaTimeout.current = setTimeout(() => setDesktopMega(false), 0);
  };

  useEffect(() => {
    setDesktopMega(false);
  }, [location.pathname]);

  const handleNav = (href: string) => {
    setOpen(false);
    if (href.startsWith("/#")) {
      if (location.pathname === "/") {
        const el = document.querySelector(href.replace("/", ""));
        el?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={aceLogo} alt="The Ace Academy" className="h-12 w-auto" />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <LanguageSelector />
            <ThemeToggle />
            {desktopNavItems.map((item) =>
              item.label === t.nav.programs ? (
                <div key={item.label} className="relative" onMouseEnter={openMega} onMouseLeave={closeMega}>
                  <Link to={item.href} onClick={() => { handleNav(item.href); setDesktopMega(false); }} className="font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </div>
              ) : (
                <Link key={item.label} to={item.href} onClick={() => handleNav(item.href)} className="font-body text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  {item.label}
                </Link>
              )
            )}
            {user ? (
              <Link to={role === "admin" ? "/admin" : role === "coach" ? "/coach" : "/dashboard"} className="bg-primary text-primary-foreground font-body font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-primary-foreground hover:text-primary transition-colors flex items-center gap-2">
                <LayoutDashboard size={16} />
                Portal
              </Link>
            ) : (
              <Link to="/login" className="bg-primary text-primary-foreground font-body font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-primary-foreground hover:text-primary transition-colors flex items-center gap-2">
                <LogIn size={16} />
                Register / Log in
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2 mr-[-8px]">
            <LanguageSelector />
            <ThemeToggle />
            <button onClick={() => setOpen(!open)} className="text-foreground z-[110] relative" aria-label={open ? "Close menu" : "Open menu"}>
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Desktop Mega Menu */}
      {createPortal(
        <AnimatePresence>
          {desktopMega && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="hidden md:block fixed top-16 left-0 right-0 bottom-0 z-[99]" onClick={() => setDesktopMega(false)}>
              <div className="w-[60%] mx-auto bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8 mt-2" onMouseEnter={openMega} onMouseLeave={closeMega} onClick={(e) => e.stopPropagation()}>
                <Link to="/programs" onClick={() => setDesktopMega(false)} className="inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-display text-lg tracking-wide px-8 py-3.5 rounded-xl transition-colors mb-6 w-full sm:w-auto">
                  {t.megaMenu.allPrograms} <ArrowRight size={18} />
                </Link>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <p className="font-body text-primary text-xs font-semibold tracking-[0.2em] uppercase">{t.megaMenu.multiDay}</p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {desktopMegaCamps.map((item) => (
                      <Link key={item.title} to={item.link} onClick={() => setDesktopMega(false)} className="group relative bg-card border-2 border-primary/30 hover:border-primary rounded-xl p-4 transition-all hover:bg-secondary/50 block overflow-hidden">
                        <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" loading="lazy" width={400} height={300} />
                        <div className="absolute top-2 right-2 z-10"><PulsingDot /></div>
                        <div className="relative z-10 flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-body text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">{t.coursesSection.camp}</span>
                            <span className="font-body text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">{item.tag}</span>
                          </div>
                          <span className="font-display text-lg text-primary">{item.price}</span>
                        </div>
                        <div className="relative z-10">
                          <h4 className="font-display text-base text-foreground">{item.title}</h4>
                          <p className="font-body text-muted-foreground text-xs">{item.subtitle}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="font-body text-primary text-xs font-semibold tracking-[0.2em] uppercase">{t.megaMenu.coursesTraining}</p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {desktopMegaCourses.map((item) => (
                      <Link key={item.title} to={item.link} onClick={() => setDesktopMega(false)} className="group relative bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-all hover:bg-secondary/50 block overflow-hidden">
                        <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" loading="lazy" width={400} height={300} />
                        <div className="absolute top-2 right-2 z-10"><PulsingDot /></div>
                        <div className="relative z-10 flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-body text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase">{t.coursesSection.course}</span>
                            <span className="font-body text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">{item.tag}</span>
                          </div>
                          <span className="font-display text-lg text-primary">{item.price}</span>
                        </div>
                        <div className="relative z-10">
                          <h4 className="font-display text-base text-foreground">{item.title}</h4>
                          <p className="font-body text-muted-foreground text-xs">{item.subtitle}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Mobile Mega Menu */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="md:hidden fixed inset-0 top-16 z-[105] bg-background overflow-y-auto">
              <div className="min-h-full flex flex-col px-4 pt-6 pb-6">
                <div className="flex flex-col gap-3 flex-1">
                  {megaMenuTiles.map((tile, i) => (
                    <motion.div key={tile.label} className="flex flex-col gap-3" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: (i + 1) * 0.15 }}>
                      <Link to={tile.href} onClick={() => handleNav(tile.href)} className={`relative overflow-hidden rounded-2xl group ${tile.border ? 'border-[3px] ' + tile.border : ''} ${tile.size === "large" ? "min-h-[160px]" : "min-h-[100px]"}`}>
                        <img src={tile.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-background/30" />
                        <div className="relative z-10 flex items-end justify-between h-full p-5">
                          <div>
                            <p className="font-body text-xs font-semibold tracking-[0.2em] uppercase text-foreground/70 mb-1">{tile.subtitle}</p>
                            <h3 className="font-display text-2xl sm:text-3xl text-foreground leading-tight">{tile.label}</h3>
                          </div>
                          <ArrowRight className="text-foreground/60 group-hover:text-primary transition-colors shrink-0 ml-4" size={24} />
                        </div>
                      </Link>
                      {i === 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {campTiles.map((camp) => (
                            <Link key={camp.label} to={camp.href} onClick={() => handleNav(camp.href)} className="relative overflow-hidden rounded-xl aspect-[3/4] group">
                              <img src={camp.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-background/40" />
                              <div className="relative z-10 flex flex-col justify-between h-full p-2.5">
                                <ArrowRight size={14} className="text-foreground/60 group-hover:text-primary transition-colors self-end" />
                                <p className="font-display text-base text-foreground leading-tight tracking-widest w-full">{camp.label}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <motion.div className="grid grid-cols-3 gap-2 px-2 pt-6 pb-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: 0.6 }}>
                  {megaMenuLinks.map((link) => (
                    <Link key={link.label} to={link.href} onClick={() => handleNav(link.href)} className="font-body text-sm font-semibold tracking-[0.1em] uppercase text-foreground/80 hover:text-primary transition-all bg-card border border-border rounded-xl py-3 text-center shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.4)] hover:shadow-[3px_3px_0px_0px_hsl(var(--primary))] hover:translate-y-[-1px]">
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: 0.75 }}>
                  {user ? (
                    <Link to={role === "admin" ? "/admin" : role === "coach" ? "/coach" : "/dashboard"} onClick={() => handleNav(role === "admin" ? "/admin" : role === "coach" ? "/coach" : "/dashboard")} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-body font-bold text-base py-4 rounded-2xl hover:bg-primary-foreground hover:text-primary transition-colors">
                      <LayoutDashboard size={18} />
                      Portal
                    </Link>
                  ) : (
                    <Link to="/login" onClick={() => handleNav("/login")} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-body font-bold text-base py-4 rounded-2xl hover:bg-primary-foreground hover:text-primary transition-colors">
                      <LogIn size={18} />
                      Register / Log in
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Navbar;
