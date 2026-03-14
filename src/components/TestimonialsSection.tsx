import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import AceSpade from "./AceSpade";

const testimonials = [
  { name: "Angela Charlton", role: "Software Engineer", text: "Three days felt like an entire training season compressed into one powerful experience. The sessions were structured, focused, and full of purpose. I improved my footwork, positioning, and consistency more than I ever expected.", rating: 5 },
  { name: "Saif Guerra", role: "Junior Web Designer", text: "This was the hardest but most impactful training I've ever done. The coaches pushed me just far enough to challenge me without breaking me. The progress I made in such a short amount of time was unbelievable.", rating: 5 },
  { name: "Sophie Adams", role: "Marketing Specialist", text: "As a weekend warrior, I found not just facilities — but a team that motivates me daily. This Academy gave me confidence, friends, and a stronger love for the game.", rating: 5 },
];

const TestimonialsSection = () => {
  const { t } = useLanguage();
  return (
    <section className="py-24 bg-cream-dark">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <AceSpade size="sm" opacity={0.2} className="mb-3" />
          <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{t.testimonials.subtitle}</p>
          <h2 className="font-display text-5xl md:text-7xl text-foreground">
            {t.testimonials.title} <span className="text-gradient">{t.testimonials.titleGradient}</span>
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-card border border-border rounded-2xl p-8">
              <div className="flex gap-1 mb-5">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} className="text-primary fill-primary" size={16} />
                ))}
              </div>
              <p className="font-body text-foreground text-sm leading-relaxed mb-6 italic">"{item.text}"</p>
              <div>
                <p className="font-body font-semibold text-foreground text-sm">{item.name}</p>
                <p className="font-body text-muted-foreground text-xs">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
