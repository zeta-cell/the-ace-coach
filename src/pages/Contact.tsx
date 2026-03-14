import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send, MessageCircle, Shield, Trophy, Users, Globe, Sun, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import contactBg from "@/assets/contact-bg.jpeg";
import valenciaAerial from "@/assets/valencia-aerial.jpg";
import aceIconRed from "@/assets/the-ace-icon-red.png";

const Contact = () => {
  const { t } = useLanguage();
  const c = t.contactPage;
  const [form, setForm] = useState({ name: "", email: "", phone: "", camp: "", course: "", message: "" });
  const [sending, setSending] = useState(false);

  const trustPoints = [
    { icon: Trophy, title: c.trustPlayers, desc: c.trustPlayersDesc },
    { icon: Shield, title: c.trustCertified, desc: c.trustCertifiedDesc },
    { icon: Users, title: c.trustSmall, desc: c.trustSmallDesc },
    { icon: Globe, title: c.trustCamps, desc: c.trustCampsDesc },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { toast.error(c.errorFill); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error(c.errorEmail); return; }
    setSending(true);
    setTimeout(() => { toast.success(c.success); setForm({ name: "", email: "", phone: "", camp: "", course: "", message: "" }); setSending(false); }, 800);
  };

  const inputClasses = "w-full bg-card border border-border rounded-xl px-4 py-3.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all";
  const selectClasses = "w-full bg-card border border-border rounded-xl px-4 py-3.5 font-body text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0"><img src={contactBg} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-overlay-hero" /></div>
        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{c.subtitle}</p>
            <h1 className="font-display text-6xl md:text-8xl text-foreground mb-6">{c.title} <span className="text-gradient">{c.titleGradient}</span></h1>
            <p className="font-body text-muted-foreground text-lg leading-relaxed max-w-2xl">{c.desc}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustPoints.map((point, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><point.icon className="text-primary" size={24} /></div>
                <h3 className="font-display text-xl text-foreground mb-1">{point.title}</h3>
                <p className="font-body text-muted-foreground text-xs leading-relaxed">{point.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0"><img src={contactBg} alt="" className="w-full h-full object-cover opacity-[0.04]" /></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-5 gap-12">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-3">
              <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{c.bookSpot}</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground mb-2">{c.tellUsAbout} <span className="text-gradient">{c.tellUsAboutGradient}</span></h2>
              <p className="font-body text-muted-foreground mb-8 leading-relaxed">{c.formDesc}</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input name="name" value={form.name} onChange={handleChange} placeholder={c.yourNamePlaceholder} className={inputClasses} maxLength={100} />
                  <input name="email" value={form.email} onChange={handleChange} placeholder={c.yourEmailPlaceholder} type="email" className={inputClasses} maxLength={255} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder={c.phonePlaceholder} className={inputClasses} maxLength={30} />
                  <select name="camp" value={form.camp} onChange={handleChange} className={selectClasses}>
                    <option value="">{t.contactSection.selectCamp}</option>
                    {c.camps.map((camp) => <option key={camp} value={camp}>{camp}</option>)}
                  </select>
                </div>
                <select name="course" value={form.course} onChange={handleChange} className={selectClasses}>
                  <option value="">{t.contactSection.selectCourse}</option>
                  {c.courses.map((course) => <option key={course} value={course}>{course}</option>)}
                </select>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder={c.messagePlaceholder} rows={5} className={inputClasses + " resize-none"} maxLength={1000} />
                <button type="submit" disabled={sending} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-body font-semibold px-10 py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-base">
                  <Send size={18} /> {sending ? c.sending : c.send}
                </button>
              </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-2 space-y-6">
              <a href="https://wa.me/34615105541" target="_blank" rel="noopener noreferrer" className="block bg-[hsl(142,70%,20%)] border border-[hsl(142,60%,30%)] rounded-2xl p-6 hover:bg-[hsl(142,70%,25%)] transition-colors group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[hsl(142,70%,40%)] flex items-center justify-center"><MessageCircle className="text-foreground" size={22} /></div>
                  <div><p className="font-display text-xl text-foreground">{c.whatsappUs}</p><p className="font-body text-sm text-[hsl(142,50%,60%)]">{c.whatsappFastest}</p></div>
                </div>
                <p className="font-body text-sm text-foreground/80 leading-relaxed mb-3">{c.whatsappDesc}</p>
                <span className="font-body text-sm font-semibold text-[hsl(142,50%,60%)] group-hover:text-foreground transition-colors inline-flex items-center gap-1">+34 615 10 55 41 <ChevronRight size={14} /></span>
              </a>

              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="font-body text-primary text-xs font-semibold tracking-[0.3em] uppercase mb-2">{c.directContact}</p>
                <h3 className="font-display text-2xl text-foreground mb-5">{c.reachOut} <span className="text-gradient">{c.reachOutGradient}</span></h3>
                <div className="space-y-4">
                  {[{ icon: MapPin, label: "Valencia, Spain", href: "" }, { icon: Mail, label: "info@the-ace.academy", href: "mailto:info@the-ace.academy" }, { icon: Phone, label: "+34 615 10 55 41", href: "tel:+34615105541" }].map((item) => (
                    <a key={item.label} href={item.href || undefined} className={`flex items-center gap-3 group ${item.href ? "cursor-pointer" : ""}`}>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0"><item.icon className="text-primary" size={18} /></div>
                      <p className="font-body text-foreground text-sm group-hover:text-primary transition-colors">{item.label}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4"><img src={aceIconRed} alt="" className="w-8" /><p className="font-display text-xl text-foreground">{c.aceMethodTitle}</p></div>
                <p className="font-body text-muted-foreground text-sm leading-relaxed mb-3">{c.aceMethodDesc}</p>
                <Link to="/about" className="font-body text-primary text-sm font-semibold hover:underline inline-flex items-center gap-1">{c.learnMore} <ChevronRight size={14} /></Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative rounded-2xl overflow-hidden">
              <img src={valenciaAerial} alt="Valencia aerial view" className="w-full h-[400px] object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-overlay-dark rounded-2xl" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"><Sun className="text-primary" size={22} /></div>
                  <div><p className="font-display text-xl text-foreground">300+ Days of Sun</p><p className="font-body text-sm text-muted-foreground">Year-round outdoor training</p></div>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{c.homeBase}</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground mb-6">{c.valenciaTitle} <span className="text-gradient">{c.valenciaGradient}</span> {c.valenciaEnd}</h2>
              <p className="font-body text-muted-foreground leading-relaxed mb-4">{c.valenciaP1}</p>
              <p className="font-body text-muted-foreground leading-relaxed mb-6">{c.valenciaP2}</p>
              <Link to="/about" className="inline-flex items-center gap-2 font-body text-primary font-semibold hover:underline">{c.exploreValencia} <ChevronRight size={16} /></Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{c.beyondSpain}</p>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">{c.campsAcross} <span className="text-gradient">{c.campsAcrossGradient}</span></h2>
            <p className="font-body text-muted-foreground max-w-2xl mx-auto leading-relaxed">{c.campsAcrossDesc}</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {c.europeLocations.map((loc, i) => (
              <motion.div key={loc.city} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3"><Globe className="text-primary" size={18} /></div>
                <h4 className="font-display text-xl text-foreground">{loc.city}</h4>
                <p className="font-body text-muted-foreground text-xs">{loc.country}</p>
                <span className="inline-block mt-2 font-body text-[10px] font-semibold tracking-wide uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">{loc.status}</span>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-10">
            <p className="font-body text-muted-foreground text-sm mb-4">{c.wantCampInCity}</p>
            <a href="https://wa.me/34615105541?text=Hi!%20I%27d%20like%20to%20apply%20for%20a%20camp%20in%20my%20city." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-body font-semibold px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors">
              <Globe size={18} /> {c.applyCampCity}
            </a>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">{c.readyTo} <span className="text-gradient">{c.readyToGradient}</span>?</h2>
            <p className="font-body text-muted-foreground mb-8 max-w-xl mx-auto">{c.readyToDesc}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://wa.me/34615105541" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[hsl(142,70%,30%)] text-foreground font-body font-semibold px-8 py-4 rounded-xl hover:bg-[hsl(142,70%,35%)] transition-colors">
                <MessageCircle size={18} /> {c.whatsappNow}
              </a>
              <Link to="/programs" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-body font-semibold px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors">
                {c.browsePrograms} <ChevronRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;