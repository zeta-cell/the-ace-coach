import CoursePageTemplate from "@/components/CoursePageTemplate";
import { useLanguage } from "@/i18n/LanguageContext";
import campAdvanced from "@/assets/camp-advanced.jpg";

const AdvancedCamp = () => {
  const { t } = useLanguage();
  const p = t.pages.advancedCamp;
  return (
    <CoursePageTemplate
      heroImage={campAdvanced}
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
      learnings={p.learnings}
      targets={p.targets}
      schedule={p.schedule}
      scheduleLabel={p.scheduleLabel}
      sidebarTitle={p.sidebarTitle}
      price="749€"
      duration={p.duration}
      level={p.level}
      levelLabel={p.levelLabel}
      
      days={5}
    />
  );
};

export default AdvancedCamp;