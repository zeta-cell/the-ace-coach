import CoursePageTemplate from "@/components/CoursePageTemplate";
import { useLanguage } from "@/i18n/LanguageContext";
import { Zap } from "lucide-react";
import campPro from "@/assets/camp-pro.jpg";

const ProCamp = () => {
  const { t } = useLanguage();
  const p = t.pages.proCamp;
  return (
    <CoursePageTemplate
      heroImage={campPro}
      label={p.label}
      heroTitle={p.heroTitle}
      heroSubtitle={p.heroSubtitle}
      sectionTitle={p.sectionTitle}
      sectionGradient={p.sectionGradient}
      hours={p.hours}
      introTitle={p.introTitle}
      introText={p.introText}
      programTitle={p.programTitle}
      programText={p.programText}
      extraSections={
        <div className="space-y-4 mb-8">
          {p.proExtras.map((extra) => (
            <div key={extra.title} className="bg-card border border-border rounded-xl p-5">
              <h4 className="font-body font-semibold text-foreground text-sm mb-1 flex items-center gap-2"><Zap className="text-primary" size={16} /> {extra.title}</h4>
              <p className="font-body text-muted-foreground text-xs leading-relaxed">{extra.desc}</p>
            </div>
          ))}
        </div>
      }
      learnings={p.learnings}
      targets={p.targets}
      schedule={p.schedule}
      scheduleLabel={p.scheduleLabel}
      sidebarTitle={p.sidebarTitle}
      price="849€"
      duration={p.duration}
      level={p.level}
      levelLabel={p.levelLabel}
      
      days={5}
    />
  );
};

export default ProCamp;