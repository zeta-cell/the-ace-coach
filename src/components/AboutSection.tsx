import { motion } from "framer-motion";
import { Target, Users, Trophy, Headphones } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import communityImage from "@/assets/about-bg.jpeg";
import AceSpade from "./AceSpade";

const AboutSection = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Target, title: t.aboutSection.aceMethod, desc: t.aboutSection.aceMethodDesc },
    { icon: Users, title: t.aboutSection.individualProgramming, desc: t.aboutSection.individualProgrammingDesc },
    { icon: Trophy, title: t.aboutSection.tournaments, desc: t.aboutSection.tournamentsDesc },
    { icon: Headphones, title: t.aboutSection.allInclusive, desc: t.aboutSection.allInclusiveDesc },
  ];

  return (
    <section id="about" className="py-24 bg-cream-dark">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative rounded-2xl overflow-hidden">
            <img src={communityImage} alt="The Ace Academy community" className="w-full h-[500px] object-cover rounded-2xl" loading="lazy" width={800} height={500} />
            <div className="absolute inset-0 bg-overlay-dark rounded-2xl" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
                <div className="bg-hero-gradient rounded-full w-14 h-14 flex items-center justify-center font-display text-2xl text-primary-foreground">4.9</div>
                <div>
                  <p className="font-display text-xl text-foreground">{t.aboutSection.reviews}</p>
                  <p className="font-body text-sm text-muted-foreground">{t.aboutSection.reviewsDesc}</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <AceSpade size="sm" opacity={0.2} className="mb-3" />
            <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{t.aboutSection.subtitle}</p>
            <h2 className="font-display text-5xl md:text-6xl text-foreground mb-6">
              {t.aboutSection.title} <span className="text-gradient">{t.aboutSection.titleGradient}</span> {t.aboutSection.titleEnd}
            </h2>
            <p className="font-body text-muted-foreground mb-10 leading-relaxed">{t.aboutSection.desc}</p>
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-body font-semibold text-foreground text-sm mb-1">{f.title}</h4>
                    <p className="font-body text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
