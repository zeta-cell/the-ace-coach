import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

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

const CoursesSection = () => {
  const { t } = useLanguage();
  const pg = t.programsPage;

  const camps = [
    { ...pg.camps.tactical, price: "749€", link: "/tactical-masterclass", image: courseMastermind },
    { ...pg.camps.partner, price: "649€", link: "/partner-training", image: coursePartner },
  ];

  const courses = [
    { ...pg.courses.playWithPro, price: "129€", link: "/play-with-pro", image: courseTactical },
    { ...pg.courses.crash, price: "349€", link: "/crash-course", image: courseCrash },
    { ...pg.courses.oneShot, price: "59€", link: "/one-shot-clinic", image: courseOneshot },
    { ...pg.courses.fixer, price: "59€", link: "/the-fixer", image: coursePrivate },
    { ...pg.courses.video, price: "99€", link: "/video-deep-dive", image: courseVideo },
    { ...pg.courses.weekend, price: "399€", link: "/weekend-warrior", image: courseWeekend },
    { ...pg.courses.assessment, price: "49€", link: "/pre-camp-assessment", image: courseAssessment },
  ];
  return (
    <section id="courses" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{t.coursesSection.campsSubtitle}</p>
          <h2 className="font-display text-5xl md:text-7xl text-foreground">
            {t.coursesSection.campsTitle} <span className="text-gradient">{t.coursesSection.campsTitleGradient}</span>
          </h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {camps.map((course, i) => (
            <motion.div key={course.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Link to={course.link} className="group relative bg-card border-2 border-primary/30 hover:border-primary rounded-xl p-5 flex flex-col transition-all hover:bg-secondary/50 block overflow-hidden">
                <img src={course.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" loading="lazy" width={400} height={300} />
                <div className="absolute top-2 right-2 z-10"><PulsingDot /></div>
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full uppercase">{t.coursesSection.camp}</span>
                    <span className="font-body text-xs text-white font-semibold bg-white/20 px-3 py-1 rounded-full">{course.tag}</span>
                  </div>
                  <span className="font-display text-xl text-primary">{course.price}</span>
                </div>
                <div className="relative z-10">
                  <h4 className="font-display text-xl text-foreground">{course.title}</h4>
                  <p className="font-body text-white/80 text-sm">{course.subtitle}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{t.coursesSection.coursesSubtitle}</p>
          <h2 className="font-display text-5xl md:text-7xl text-foreground">
            {t.coursesSection.coursesTitle} <span className="text-gradient">{t.coursesSection.coursesTitleGradient}</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground mt-6 max-w-md mx-auto leading-relaxed">{t.coursesSection.coursesTagline}</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, i) => (
            <motion.div key={course.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Link to={course.link} className="group relative bg-card border border-border hover:border-primary/40 rounded-xl p-5 flex flex-col transition-all hover:bg-secondary/50 block overflow-hidden">
                <img src={course.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none" loading="lazy" width={400} height={300} />
                <div className="absolute top-2 right-2 z-10"><PulsingDot /></div>
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs font-semibold bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full uppercase">{t.coursesSection.course}</span>
                    <span className="font-body text-xs text-white font-semibold bg-white/20 px-3 py-1 rounded-full">{course.tag}</span>
                  </div>
                  <span className="font-display text-xl text-primary">{course.price}</span>
                </div>
                <div className="relative z-10">
                  <h4 className="font-display text-xl text-foreground">{course.title}</h4>
                  <p className="font-body text-white/80 text-sm">{course.subtitle}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
