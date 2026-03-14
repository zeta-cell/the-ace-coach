import CoursePageTemplate from "@/components/CoursePageTemplate";
import { useLanguage } from "@/i18n/LanguageContext";
import courseWeekend from "@/assets/course-weekend.jpeg";

const WeekendWarrior = () => {
  const { t } = useLanguage();
  const p = t.pages.weekendWarrior;
  return (
    <CoursePageTemplate
      heroImage={courseWeekend}
      label={p.label} heroTitle={p.heroTitle} heroSubtitle={p.heroSubtitle}
      sectionTitle={p.sectionTitle} sectionGradient={p.sectionGradient} hours={p.hours}
      introTitle={p.introTitle} introText={p.introText}
      programTitle={p.programTitle} programText={p.programText}
      learnings={p.learnings} targets={p.targets} schedule={p.schedule}
      scheduleLabel={p.scheduleLabel} sidebarTitle={p.sidebarTitle}
      price="399€" duration={p.duration} level={p.level} levelLabel={p.levelLabel}
      days={3}
    />
  );
};

export default WeekendWarrior;