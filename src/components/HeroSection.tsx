import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import heroImage from "@/assets/hero-bg.jpeg";
import aceIconRed from "@/assets/the-ace-icon-red.png";

const HeroSection = () => {
  const { t } = useLanguage();
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Padel player" className="w-full h-full object-cover object-top" fetchPriority="high" width={1920} height={1080} />
        <div className="absolute inset-0 bg-overlay-hero" />
      </div>
      <div className="relative z-10 container mx-auto px-4 pb-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-6">
            {t.hero.title1}<br />
            <span className="text-gradient">{t.hero.title2}</span>
          </h1>
          <p className="font-body text-lg text-white max-w-md mb-10 leading-relaxed">
            {t.hero.desc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/programs" className="bg-primary text-primary-foreground font-body font-bold text-lg px-10 py-4 rounded-lg hover:bg-primary-foreground hover:text-primary transition-colors text-center">
              {t.hero.exploreCamps}
            </Link>
            <Link to="/about" className="border border-primary/30 text-foreground font-body font-medium text-lg px-10 py-4 rounded-lg hover:border-primary hover:text-primary transition-colors text-center">
              {t.hero.aboutAce}
            </Link>
          </div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <ChevronDown className="text-muted-foreground" size={28} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
