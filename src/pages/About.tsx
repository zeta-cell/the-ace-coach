import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";
import AceSpade from "@/components/AceSpade";
import aboutBg from "@/assets/about-bg.jpeg";
import aceAlignBg from "@/assets/ace-align-bg.jpeg";
import aceCalibrateBg from "@/assets/ace-calibrate-bg.jpeg";
import aceExecuteBg from "@/assets/ace-execute-bg.jpeg";
import communityImg from "@/assets/community.jpg";
import coachSolachi from "@/assets/coach-solachi.jpeg";
import coachFrancisco from "@/assets/coach-francisco.jpeg";
import coachMiguel from "@/assets/coach-miguel.jpeg";
import ValenciaSection from "@/components/ValenciaSection";

const coachImages = [coachSolachi, coachFrancisco, coachMiguel];
const aceImages = [aceAlignBg, aceCalibrateBg, aceExecuteBg];
const coachStyles = [
  "object-cover object-[center_25%] scale-[1.8]",
  "object-cover object-[center_20%] scale-[1.8] translate-y-[80px]",
  "object-cover object-[center_15%]",
];

const About = () => {
  const { t } = useLanguage();
  const a = t.aboutPage;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={aboutBg} alt="" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Breadcrumbs />
          <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-2">{a.subtitle}</p>
          <h1 className="font-display text-6xl md:text-8xl text-foreground">
            {a.title} <span className="text-gradient">{a.titleGradient}</span>
          </h1>
        </div>
      </section>

      <section className="py-20 bg-cream-dark">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="font-body text-muted-foreground text-lg leading-relaxed mb-6">{a.philosophy1}</p>
              <p className="font-body text-muted-foreground text-lg leading-relaxed">{a.philosophy2}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative rounded-2xl overflow-hidden">
              <img src={communityImg} alt="ACE Academy training" className="w-full h-[450px] object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-overlay-dark rounded-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <AceSpade size="sm" opacity={0.2} className="mb-3" />
            <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{a.methodSubtitle}</p>
            <h2 className="font-display text-5xl md:text-7xl text-foreground">
              {a.methodTitle} <span className="text-gradient">{a.methodTitleGradient}</span>
            </h2>
            <p className="font-body text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">{a.methodDesc}</p>
          </motion.div>

          {/* A — Align (full width) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative rounded-2xl overflow-hidden mb-8 bg-card border border-border">
            <img src={aceImages[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
            <div className="relative z-10 p-8 md:p-12 grid md:grid-cols-3 gap-8 items-start">
              <div>
                <h3 className="font-display text-5xl md:text-7xl text-foreground mb-4">
                  {a.aceSteps[0].letter} — {a.aceSteps[0].title}
                </h3>
              </div>
              <div>
                <p className="font-body font-bold text-foreground mb-2">{a.aceSteps[0].subtitle}</p>
                <p className="font-body text-muted-foreground text-sm italic mb-4">{a.aceSteps[0].intro}</p>
                <p className="font-body text-muted-foreground text-sm mb-3">{a.aceSteps[0].desc}</p>
                <ul className="font-body text-muted-foreground text-sm space-y-1 list-disc list-inside mb-4">
                  {a.aceSteps[0].bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
                <p className="font-body text-muted-foreground text-sm">{a.aceSteps[0].closing}</p>
              </div>
              <div className="flex items-start justify-end">
                <div className="border-l-2 border-primary pl-4">
                  <p className="font-body text-muted-foreground text-sm italic">{a.aceSteps[0].quote}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {a.aceSteps.slice(1).map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative rounded-2xl overflow-hidden bg-card border border-border">
                <img src={aceImages[i + 1]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
                <div className="relative z-10 p-8 md:p-10">
                  <h3 className="font-display text-4xl md:text-6xl text-foreground mb-6">{step.letter} — {step.title}</h3>
                  <p className="font-body font-bold text-foreground text-sm mb-2">{step.subtitle}</p>
                  <p className="font-body text-muted-foreground text-sm mb-3">{step.intro}</p>
                  <p className="font-body text-muted-foreground text-sm mb-3">{step.desc}</p>
                  <ul className="font-body text-muted-foreground text-sm space-y-1 list-disc list-inside mb-4">
                    {step.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                  {step.closing && <p className="font-body text-muted-foreground text-sm mb-4">{step.closing}</p>}
                  <div className="border-l-2 border-primary pl-4 mt-4">
                    <p className="font-body text-muted-foreground text-sm italic">{step.quote}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-cream-dark">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <AceSpade size="sm" opacity={0.2} className="mb-3" />
            <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{a.timelineSubtitle}</p>
            <h2 className="font-display text-5xl md:text-7xl text-foreground">
              {a.timelineTitle} <span className="text-gradient">{a.timelineTitleGradient}</span> {a.timelineTitleEnd}
            </h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-border lg:-translate-x-px" />
            <div className="space-y-12">
              {a.timeline.map((item, i) => (
                <motion.div key={item.period} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className={`relative flex flex-col lg:flex-row gap-8 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}>
                  <div className="lg:w-1/2 pl-12 lg:pl-0">
                    <div className={`${i % 2 === 0 ? "lg:pr-16 lg:text-right" : "lg:pl-16"}`}>
                      <span className="font-body text-xs text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full">{item.period}</span>
                      <p className="font-body text-primary text-sm font-semibold tracking-wider uppercase mt-3 mb-1">{item.label}</p>
                      <h3 className="font-display text-3xl text-foreground mb-3">{item.title}</h3>
                      <p className="font-body text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="absolute left-4 lg:left-1/2 top-0 w-3 h-3 bg-primary rounded-full -translate-x-1.5 mt-1" />
                  <div className="hidden lg:block lg:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <AceSpade size="sm" opacity={0.2} className="mb-3" />
            <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{a.coachesSubtitle}</p>
            <h2 className="font-display text-5xl md:text-7xl text-foreground">
              {a.coachesTitle} <span className="text-gradient">{a.coachesTitleGradient}</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {a.coaches.map((coach, i) => (
              <motion.div key={coach.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors">
                <div className="h-80 bg-secondary flex items-center justify-center overflow-hidden">
                  {coachImages[i] ? (
                    <img src={coachImages[i]!} alt={coach.name} className={`w-full h-full ${coachStyles[i]}`} />
                  ) : (
                    <span className="font-display text-6xl text-muted-foreground/30">{coach.name.charAt(0)}</span>
                  )}
                </div>
                <div className="p-6">
                  <p className="font-body text-xs text-primary font-semibold tracking-wider uppercase mb-1">{coach.role}</p>
                  <h3 className="font-display text-2xl text-foreground mb-3">{coach.name}</h3>
                  <p className="font-body text-muted-foreground text-sm leading-relaxed">{coach.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ValenciaSection />

      <section className="py-20 bg-cream-dark">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <AceSpade size="sm" opacity={0.2} className="mb-3" />
            <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{a.partnershipsSubtitle}</p>
            <h2 className="font-display text-5xl text-foreground mb-6">
              {a.partnershipsTitle} <span className="text-gradient">{a.partnershipsTitleGradient}</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">{a.partnershipsDesc}</p>
            <Link to="/programs" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-body font-bold text-sm px-8 py-3 rounded-lg hover:bg-primary-foreground hover:text-primary transition-colors">
              {a.explorePrograms} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      <ContactSection />
      <Footer />
    </div>
  );
};

export default About;