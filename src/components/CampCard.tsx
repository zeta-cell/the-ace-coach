import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

interface CampCardProps {
  title: string;
  level: string;
  hours: string;
  description: string;
  image: string;
  link: string;
  index: number;
}

const PulsingDot = () => (
  <span className="relative flex h-2.5 w-2.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
  </span>
);

const CampCard = ({ title, level, hours, description, image, link, index }: CampCardProps) => {
  const { t } = useLanguage();
  return (
    <Link to={link} className="block">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.15 }} className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer">
        <div className="absolute top-3 right-3 z-20"><PulsingDot /></div>
        <div className="relative h-72 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" width={600} height={400} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
          <div className="absolute top-4 left-4">
            <span className="bg-hero-gradient text-primary-foreground font-body text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{level}</span>
          </div>
          <div className="absolute bottom-4 right-4">
            <span className="bg-background/80 backdrop-blur-sm text-foreground font-display text-2xl px-4 py-1 rounded-lg">{hours}</span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-display text-3xl text-foreground mb-3">{title}</h3>
          <p className="font-body text-muted-foreground text-sm leading-relaxed mb-5">{description}</p>
          <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-body font-bold text-sm px-8 py-3 rounded-lg group-hover:bg-primary-foreground group-hover:text-primary transition-colors">
            {t.campsSection.viewDetails}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

export default CampCard;
