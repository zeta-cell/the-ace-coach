import CampCard from "./CampCard";
import campBeginner from "@/assets/camp-card-bg.jpeg";
import campAdvanced from "@/assets/camp-advanced.jpg";
import campPro from "@/assets/camp-pro.jpg";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import AceSpade from "./AceSpade";

const CampsSection = () => {
  const { t } = useLanguage();

  const camps = [
    { title: t.campsSection.beginnerTitle, level: "Level 0.5 – 1.9", hours: "20H", description: t.campsSection.beginnerDesc, image: campBeginner, link: "/beginner-camp" },
    { title: t.campsSection.advancedTitle, level: "Level 2.0 – 3.5", hours: "22H", description: t.campsSection.advancedDesc, image: campAdvanced, link: "/advanced-camp" },
    { title: t.campsSection.proTitle, level: "Level 3.6 – 5.0", hours: "23H", description: t.campsSection.proDesc, image: campPro, link: "/pro-camp" },
  ];

  return (
    <section id="programs" className="pt-4 pb-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <AceSpade size="sm" opacity={0.2} className="mb-3" />
          <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{t.campsSection.subtitle}</p>
          <h2 className="font-display text-5xl md:text-7xl text-foreground">
            {t.campsSection.title} <span className="text-gradient">{t.campsSection.titleGradient}</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground mt-4 mb-0 max-w-md mx-auto leading-relaxed">
            {t.campsSection.tagline}
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {camps.map((camp, i) => (
            <CampCard key={camp.title} {...camp} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CampsSection;
