import CoursePageTemplate from "@/components/CoursePageTemplate";
import { useLanguage } from "@/i18n/LanguageContext";
import campBeginner from "@/assets/course-beginner.jpeg";

const BeginnerCamp = () => {
  const { t } = useLanguage();
  const p = t.pages.beginnerCamp;
  return (
    <CoursePageTemplate
      heroImage={campBeginner}
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
        <p className="font-body text-muted-foreground leading-relaxed mb-10">
          <strong className="text-foreground">{p.extraTitle}</strong> {p.extraText}
        </p>
      }
      learnings={p.learnings}
      targets={p.targets}
      schedule={p.schedule}
      scheduleLabel={p.scheduleLabel}
      sidebarTitle={p.sidebarTitle}
      price="649€"
      duration={p.duration}
      level={p.level}
      levelLabel={p.levelLabel}
      
      days={5}
    />
  );
};

export default BeginnerCamp;