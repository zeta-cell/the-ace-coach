import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Target, Zap, Trophy, Crown, Users, Crosshair, Shield, Swords, Snowflake, Activity, Puzzle, MessageCircle, Handshake, Eye, Gamepad2, Calendar, Video, Repeat, Wrench, ClipboardCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";
import AceSpade from "@/components/AceSpade";

import campBeginner from "@/assets/camp-card-bg.jpeg";
import campAdvanced from "@/assets/camp-advanced.jpg";
import campPro from "@/assets/camp-pro.jpg";
import courseMastermind from "@/assets/course-mastermind.jpeg";
import coursePartner from "@/assets/course-partner.jpeg";
import courseTactical from "@/assets/course-tactical.jpeg";
import courseCrash from "@/assets/course-crash.jpeg";
import coursePrivate from "@/assets/course-private.jpeg";
import courseVideo from "@/assets/course-video.jpeg";
import courseWeekend from "@/assets/course-weekend.jpeg";
import courseAssessment from "@/assets/course-assessment.jpeg";
import courseOneshot from "@/assets/course-oneshot.jpeg";

const PulsingDot = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
  </span>
);

const Programs = () => {
  const { t } = useLanguage();
  const pg = t.programsPage;
  const cs = t.coursesSection;

  const camps = useMemo(() => [
    { ...pg.camps.beginner, price: "649€", hours: "20h", image: campBeginner, link: "/beginner-camp", level: "Level 0.5 – 1.9", highlightIcons: [Target, Activity, Gamepad2], icon: Target },
    { ...pg.camps.advanced, price: "749€", hours: "22h", image: campAdvanced, link: "/advanced-camp", level: "Level 2.0 – 3.5", highlightIcons: [Crosshair, Shield, Swords], icon: Zap },
    { ...pg.camps.pro, price: "849€", hours: "23h", image: campPro, link: "/pro-camp", level: "Level 3.6 – 5.0", highlightIcons: [Activity, Snowflake, Eye], icon: Trophy },
    { ...pg.camps.tactical, price: "749€", hours: "22h", image: courseMastermind, link: "/tactical-masterclass", level: undefined, highlightIcons: [Puzzle, Crown, Target], icon: Crown },
    { ...pg.camps.partner, price: "649€", hours: "20h", image: coursePartner, link: "/partner-training", level: undefined, highlightIcons: [Handshake, MessageCircle, Swords], icon: Users },
  ], [pg]);

  const courses = useMemo(() => [
    { ...pg.courses.weekend, price: "399€", hours: "12h", image: courseWeekend, link: "/weekend-warrior", highlightIcons: [Calendar, Swords, Video], icon: Calendar },
    { ...pg.courses.crash, price: "349€", hours: "10h", image: courseCrash, link: "/crash-course", highlightIcons: [Zap, Target, Activity], icon: Zap },
    { ...pg.courses.playWithPro, price: "129€", hours: "2h", image: courseTactical, link: "/play-with-pro", highlightIcons: [Eye, MessageCircle, Swords], icon: Trophy },
    { ...pg.courses.video, price: "99€", hours: "1.5h", image: courseVideo, link: "/video-deep-dive", highlightIcons: [Video, Eye, ClipboardCheck], icon: Video },
    { ...pg.courses.oneShot, price: "59€", hours: "2h", image: courseOneshot, link: "/one-shot-clinic", highlightIcons: [Repeat, Crosshair, Activity], icon: Repeat },
    { ...pg.courses.fixer, price: "59€", hours: "1h", image: coursePrivate, link: "/the-fixer", highlightIcons: [Users, Wrench, Target], icon: Wrench },
    { ...pg.courses.assessment, price: "49€", hours: "1h", image: courseAssessment, link: "/pre-camp-assessment", highlightIcons: [ClipboardCheck, Eye, Target], icon: ClipboardCheck },
  ], [pg]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-10 md:pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs />
          <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-2">{pg.subtitle}</p>
          <h1 className="font-display text-6xl md:text-8xl text-foreground">
            {pg.title} <span className="text-gradient">{pg.titleGradient}</span>
          </h1>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <AceSpade size="sm" opacity={0.2} className="mb-2" />
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-2 text-center">
            {pg.ourCamps} <span className="text-gradient">{pg.ourCampsGradient}</span>
          </h2>
          <p className="font-body text-muted-foreground text-center mb-8 text-sm">{pg.campsDesc}</p>
          <div className="grid grid-cols-2 gap-3 md:gap-5">
            {camps.map((camp, i) => {
              const Icon = camp.icon;
              return (
                <motion.div key={camp.link} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className={i === camps.length - 1 && camps.length % 2 !== 0 ? "col-span-1" : ""}>
                  <Link to={camp.link} className="bg-card border-2 border-primary/30 hover:border-primary rounded-xl transition-all overflow-hidden block h-full group">
                    <div className="relative h-28 md:h-52">
                      <img src={camp.image} alt={camp.title} className="w-full h-full object-cover opacity-30" />
                      <div className="absolute top-2 right-2 md:top-3 md:right-3"><PulsingDot /></div>
                      <div className="absolute top-2 left-2 md:top-3 md:left-3 flex items-center gap-1 md:gap-2">
                        <span className="font-body text-[10px] md:text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">{cs.camp}</span>
                        <span className="font-body text-[10px] md:text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full backdrop-blur-sm">{camp.tag}</span>
                      </div>
                      <div className="hidden md:flex absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                        <Icon className="text-primary" size={20} />
                      </div>
                    </div>
                    <div className="p-3 md:p-5 bg-card">
                      <h4 className="font-display text-lg md:text-3xl text-foreground leading-tight">{camp.title}</h4>
                      <p className="font-body text-muted-foreground text-xs md:text-sm mb-1 md:mb-2">{camp.subtitle}</p>
                      <p className="font-body text-muted-foreground text-[11px] md:text-sm mb-2 md:mb-3 leading-relaxed line-clamp-2 md:line-clamp-none">{camp.desc}</p>
                      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                        {camp.highlights.map((label, hi) => {
                          const HIcon = camp.highlightIcons[hi];
                          return (
                            <span key={label} className="inline-flex items-center gap-1 font-body text-[9px] md:text-[11px] text-foreground bg-foreground/10 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full">
                              <HIcon size={9} className="md:w-[11px] md:h-[11px]" />{label}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="font-display text-base md:text-2xl text-primary">{camp.price}</span>
                          <div className="hidden md:flex items-center gap-1 mt-1 text-muted-foreground">
                            <Clock size={12} /><span className="font-body text-xs">{camp.hours} Training</span>
                          </div>
                        </div>
                        {camp.level && <span className="font-body text-xs md:text-sm font-semibold text-foreground bg-foreground/10 px-2.5 py-1 rounded-full">{camp.level}</span>}
                      </div>
                      <div className="hidden md:flex items-center gap-1 mt-4 text-primary font-body font-semibold text-sm group-hover:gap-2 transition-all">
                        {pg.infosBooking} <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-cream-dark">
        <div className="container mx-auto px-4">
          <AceSpade size="sm" opacity={0.2} className="mb-2" />
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-2 text-center">
            {pg.coursesTitle} <span className="text-gradient">{pg.coursesTitleGradient}</span>
          </h2>
          <p className="font-body text-muted-foreground text-center mb-8 text-sm">{pg.coursesDesc}</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {courses.map((course, i) => {
              const CIcon = course.icon;
              return (
                <motion.div key={course.link} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} className={i === courses.length - 1 && courses.length % 2 !== 0 ? "col-span-1" : ""}>
                  <Link to={course.link} className="bg-card border border-border hover:border-primary/40 rounded-xl transition-all overflow-hidden block h-full group">
                    <div className="relative h-24 md:h-44">
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover opacity-30" />
                      <div className="absolute top-2 right-2"><PulsingDot /></div>
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="font-body text-[10px] md:text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase backdrop-blur-sm">{cs.course}</span>
                        <span className="font-body text-[10px] md:text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full backdrop-blur-sm">{course.tag}</span>
                      </div>
                      <div className="hidden md:flex absolute bottom-3 right-3 w-10 h-10 rounded-full bg-muted/50 items-center justify-center">
                        <CIcon className="text-muted-foreground" size={20} />
                      </div>
                    </div>
                    <div className="p-3 md:p-5 bg-card">
                      <h4 className="font-display text-lg md:text-3xl text-foreground leading-tight">{course.title}</h4>
                      <p className="font-body text-muted-foreground text-xs md:text-sm mb-1 md:mb-2">{course.subtitle}</p>
                      <p className="font-body text-muted-foreground text-[11px] md:text-sm mb-2 md:mb-3 leading-relaxed line-clamp-2 md:line-clamp-none">{course.desc}</p>
                      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                        {course.highlights.map((label, hi) => {
                          const HIcon = course.highlightIcons[hi];
                          return (
                            <span key={label} className="inline-flex items-center gap-1 font-body text-[9px] md:text-[11px] text-foreground bg-foreground/10 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full">
                              <HIcon size={9} className="md:w-[11px] md:h-[11px]" />{label}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="font-display text-base md:text-2xl text-primary">{course.price}</span>
                          <div className="hidden md:flex items-center gap-1 mt-1 text-muted-foreground">
                            <Clock size={12} /><span className="font-body text-xs">{course.hours} Training</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-1 mt-4 text-primary font-body font-semibold text-sm group-hover:gap-2 transition-all">
                        {pg.infosBooking} <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <ContactSection />
      <Footer />
    </div>
  );
};

export default Programs;