import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import contactBg from "@/assets/contact-bg.jpeg";

const camps = [
  "Beginner Camp – The First Serve",
  "Advanced Camp – The Improver",
  "Pro Camp – High-Intensity",
];

const courses = [
  "Tactical Masterclass – Strategy Camp",
  "Partner Training Week",
  "Play with the Pro – Live Tactical Coaching",
  "Crash Course – 3-Day Intensive",
  "One Shot Clinic – High-Repetition Clinic",
  "The Fixer – Private 1-on-1 Coaching",
  "Video Deep Dive – Shot Analysis",
  "Weekend Warrior – 3 Days of Padel",
  "Pre-Camp Assessment – Check & Plan",
];

const ContactSection = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ name: "", email: "", camp: "", course: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(t.contactSection.errorFill);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error(t.contactSection.errorEmail);
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast.success(t.contactSection.success);
      setForm({ name: "", email: "", camp: "", course: "", message: "" });
      setSending(false);
    }, 800);
  };

  const inputClasses = "w-full bg-card border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";
  const selectClasses = "w-full bg-card border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none";

  return (
    <section id="contact" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={contactBg} alt="" className="w-full h-full object-cover opacity-[0.07]" loading="lazy" width={1920} height={1080} />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{t.contactSection.subtitle}</p>
            <h2 className="font-display text-5xl text-foreground mb-6">
              {t.contactSection.title} <span className="text-gradient">{t.contactSection.titleGradient}</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input name="name" value={form.name} onChange={handleChange} placeholder={t.contactSection.yourName} className={inputClasses} maxLength={100} />
                <input name="email" value={form.email} onChange={handleChange} placeholder={t.contactSection.yourEmail} type="email" className={inputClasses} maxLength={255} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <select name="camp" value={form.camp} onChange={handleChange} className={selectClasses}>
                  <option value="">{t.contactSection.selectCamp}</option>
                  {camps.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="course" value={form.course} onChange={handleChange} className={selectClasses}>
                  <option value="">{t.contactSection.selectCourse}</option>
                  {courses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder={t.contactSection.yourMessage} rows={4} className={inputClasses + " resize-none"} maxLength={1000} />
              <button type="submit" disabled={sending} className="inline-flex items-center gap-2 bg-hero-gradient text-primary-foreground font-body font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                <Send size={16} /> {sending ? t.contactSection.sending : t.contactSection.send}
              </button>
            </form>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid sm:grid-cols-2 gap-6 h-full">
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
              <p className="font-body text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-2">{t.contactSection.getInTouch}</p>
              <h3 className="font-display text-2xl text-foreground mb-5">
                {t.contactSection.reachOut} <span className="text-gradient">{t.contactSection.reachOutGradient}</span>
              </h3>
              <div className="space-y-4 mt-auto">
                {[
                  { icon: MapPin, label: "Valencia, Spain", href: "" },
                  { icon: Mail, label: "info@the-ace.academy", href: "mailto:info@the-ace.academy" },
                  { icon: Phone, label: "+34 615 10 55 41", href: "tel:+34615105541" },
                ].map((item) => (
                  <a key={item.label} href={item.href || undefined} className={`flex items-center gap-3 group ${item.href ? "cursor-pointer" : ""}`}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                      <item.icon className="text-primary" size={18} />
                    </div>
                    <p className="font-body text-foreground text-sm group-hover:text-primary transition-colors">{item.label}</p>
                  </a>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col">
              <p className="font-body text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-2">{t.contactSection.newsletter}</p>
              <h3 className="font-display text-2xl text-foreground mb-3">
                {t.contactSection.stayInThe} <span className="text-gradient">{t.contactSection.stayInTheGradient}</span>
              </h3>
              <p className="font-body text-muted-foreground mb-4 text-sm leading-relaxed">{t.contactSection.newsletterDesc}</p>
              <div className="flex flex-col gap-3 mt-auto">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-card border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                <button className="w-full bg-hero-gradient text-primary-foreground font-body font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm">{t.contactSection.subscribe}</button>
              </div>
              <p className="font-body text-muted-foreground text-xs mt-3">{t.contactSection.noSpam}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
