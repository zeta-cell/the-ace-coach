import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

import campBeginner from "@/assets/course-beginner.jpeg";
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

type ProgramItem = { title: string; subtitle: string; tag: string; price: string; link: string; image: string; type: "camp" | "course" };

const allPrograms: ProgramItem[] = [
  { title: "Beginner Camp", subtitle: "The First Serve", tag: "5 Days", price: "649€", link: "/beginner-camp", image: campBeginner, type: "camp" },
  { title: "Advanced Camp", subtitle: "The Improver", tag: "5 Days", price: "749€", link: "/advanced-camp", image: campAdvanced, type: "camp" },
  { title: "Pro Camp", subtitle: "High-Intensity", tag: "5 Days", price: "849€", link: "/pro-camp", image: campPro, type: "camp" },
  { title: "Tactical Masterclass", subtitle: "Strategy Camp", tag: "5 Days", price: "749€", link: "/tactical-masterclass", image: courseMastermind, type: "camp" },
  { title: "Partner Training", subtitle: "Train & Think Together", tag: "1 Week", price: "649€", link: "/partner-training", image: coursePartner, type: "camp" },
  { title: "Play with the Pro", subtitle: "Live Tactical Coaching", tag: "Custom", price: "129€", link: "/play-with-pro", image: courseTactical, type: "course" },
  { title: "Crash Course", subtitle: "3-Day Intensive", tag: "3 Days", price: "349€", link: "/crash-course", image: courseCrash, type: "course" },
  { title: "One Shot Clinic", subtitle: "High-Repetition Clinic", tag: "1 Day", price: "59€", link: "/one-shot-clinic", image: courseOneshot, type: "course" },
  { title: "The Fixer", subtitle: "Private 1-on-1 Coaching", tag: "Custom", price: "59€", link: "/the-fixer", image: coursePrivate, type: "course" },
  { title: "Video Deep Dive", subtitle: "Shot Analysis", tag: "Custom", price: "99€", link: "/video-deep-dive", image: courseVideo, type: "course" },
  { title: "Weekend Warrior", subtitle: "3-Day Executive Padel Camp", tag: "3 Days", price: "399€", link: "/weekend-warrior", image: courseWeekend, type: "course" },
  { title: "Pre-Camp Assessment", subtitle: "Check & Plan", tag: "1 Session", price: "49€", link: "/pre-camp-assessment", image: courseAssessment, type: "course" },
];

const PulsingDot = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
  </span>
);

const MorePrograms = () => {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const filtered = allPrograms.filter((p) => p.link !== pathname);
  const camps = filtered.filter((p) => p.type === "camp");
  const courses = filtered.filter((p) => p.type === "course");

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {camps.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
              <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-3">{t.morePrograms.exploreMore}</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground">
                {t.morePrograms.moreCamps} <span className="text-gradient">{t.morePrograms.moreCampsGradient}</span>
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
              {camps.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <Link to={item.link} className="group relative bg-card border-2 border-primary/30 hover:border-primary rounded-xl p-5 transition-all hover:bg-secondary/50 block overflow-hidden">
                    <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50 pointer-events-none" />
                    <div className="absolute top-2 right-2 z-10"><PulsingDot /></div>
                    <div className="relative z-10 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-xs font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full uppercase">{t.morePrograms.camp}</span>
                        <span className="font-body text-xs text-white font-semibold bg-white/20 px-3 py-1 rounded-full">{item.tag}</span>
                      </div>
                      <span className="font-display text-xl text-primary">{item.price}</span>
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-display text-xl text-white">{item.title}</h4>
                      <p className="font-body text-white/80 text-sm">{item.subtitle}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
        {courses.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
              <h2 className="font-display text-4xl md:text-5xl text-foreground">
                {t.morePrograms.coursesTitle} <span className="text-gradient">{t.morePrograms.coursesTitleGradient}</span>
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((item, i) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                  <Link to={item.link} className="group relative bg-card border border-border hover:border-primary/40 rounded-xl p-5 transition-all hover:bg-secondary/50 block overflow-hidden">
                    <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50 pointer-events-none" />
                    <div className="absolute top-2 right-2 z-10"><PulsingDot /></div>
                    <div className="relative z-10 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full uppercase">{t.morePrograms.course}</span>
                        <span className="font-body text-xs text-white font-semibold bg-white/20 px-3 py-1 rounded-full">{item.tag}</span>
                      </div>
                      <span className="font-display text-xl text-primary">{item.price}</span>
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-display text-xl text-white">{item.title}</h4>
                      <p className="font-body text-white/80 text-sm">{item.subtitle}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default MorePrograms;
