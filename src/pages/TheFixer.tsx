import CoursePageTemplate from "@/components/CoursePageTemplate";
import { useLanguage } from "@/i18n/LanguageContext";
import coursePrivate from "@/assets/course-private.jpeg";

const TheFixer = () => {
  const { t } = useLanguage();
  const p = t.pages.theFixer;
  return (
    <CoursePageTemplate
      heroImage={coursePrivate}
      label={p.label} heroTitle={p.heroTitle} heroSubtitle={p.heroSubtitle}
      sectionTitle={p.sectionTitle} sectionGradient={p.sectionGradient} hours={p.hours}
      introTitle={p.introTitle} introText={p.introText}
      programTitle={p.programTitle} programText={p.programText}
      learnings={p.learnings} targets={p.targets} schedule={p.schedule}
      scheduleLabel={p.scheduleLabel} sidebarTitle={p.sidebarTitle}
      price="59€" duration={p.duration} level={p.level} levelLabel={p.levelLabel}
      days={1}
    />
  );
};

export default TheFixer;