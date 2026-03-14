import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Users, Target, CheckCircle, Calendar as CalendarLucide, CalendarIcon, Phone, Mail } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { format, addDays } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";
import MorePrograms from "@/components/MorePrograms";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Learning { title: string; desc: string; }

interface CoursePageProps {
  heroImage: string;
  label: string;
  heroTitle: string;
  heroSubtitle?: string;
  sectionTitle: string;
  sectionGradient: string;
  hours: string;
  introTitle: string;
  introText: string;
  programTitle?: string;
  programText?: string;
  learnings: Learning[];
  targets: string[];
  schedule: string[];
  scheduleLabel?: string;
  sidebarTitle: string;
  price: string;
  duration: string;
  level: string;
  levelLabel: string;
  bookingUrl?: string;
  extraSections?: React.ReactNode;
  days?: number | null;
}

const WHATSAPP_NUMBER = "34615105541";

const CoursePageTemplate = ({
  heroImage, label, heroTitle, heroSubtitle, sectionTitle, sectionGradient, hours,
  introTitle, introText, programTitle, programText, learnings, targets, schedule,
  scheduleLabel, sidebarTitle, price, duration, level, levelLabel, extraSections, days,
}: CoursePageProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const getEndDate = (start: Date) => days ? addDays(start, days - 1) : start;

  const disabledDays = days === 5
    ? (d: Date) => d.getDay() !== 1 || d < new Date()
    : days === 3
      ? (d: Date) => { const day = d.getDay(); return (day !== 1 && day !== 3 && day !== 5) || d < new Date(); }
      : (d: Date) => d < new Date();

  const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isPhoneValid = (val: string) => /^[+\d\s()-]{6,20}$/.test(val.trim());

  const handleBooking = () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      toast({ title: t.courseTemplate.missingInfo, description: t.courseTemplate.missingInfoDesc, variant: "destructive" });
      return;
    }
    if (!isPhoneValid(phone)) {
      toast({ title: t.courseTemplate.invalidPhone, description: t.courseTemplate.invalidPhoneDesc, variant: "destructive" });
      return;
    }
    if (!isEmailValid(email)) {
      toast({ title: t.courseTemplate.invalidEmail, description: t.courseTemplate.invalidEmailDesc, variant: "destructive" });
      return;
    }
    if (days && !selectedDate) {
      toast({ title: t.courseTemplate.noDate, description: t.courseTemplate.noDateDesc, variant: "destructive" });
      return;
    }

    const dateInfo = selectedDate
      ? days && days > 1
        ? `${format(selectedDate, "EEEE, MMM d")} → ${format(getEndDate(selectedDate), "EEEE, MMM d")}`
        : format(selectedDate, "EEEE, MMM d")
      : "No date selected";

    const message = [
      `🎾 *New Booking Request*`, ``,
      `*Program:* ${sidebarTitle}`, `*Price:* ${price}`, `*Date:* ${dateInfo}`, ``,
      `*Name:* ${name.trim()}`, `*Phone:* ${phone.trim()}`, `*Email:* ${email.trim()}`,
    ].join("\n");

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative pt-16">
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img src={heroImage} alt={heroTitle} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-12">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Breadcrumbs variant="light" />
                <p className="font-body text-primary-foreground/80 text-sm tracking-[0.3em] uppercase mb-2">{label}</p>
                <h1 className="font-display text-5xl md:text-7xl text-primary-foreground">{heroTitle}{heroSubtitle && <><br />{heroSubtitle}</>}</h1>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="font-display text-4xl text-foreground">{sectionTitle} <em className="text-gradient">{sectionGradient}</em></h2>
                <p className="font-display text-2xl text-primary mt-2">{hours}</p>
              </div>
              <h3 className="font-display text-2xl text-foreground mb-4">{introTitle}</h3>
              <p className="font-body text-muted-foreground leading-relaxed mb-6">{introText}</p>
              {programTitle && programText && (
                <>
                  <h3 className="font-display text-2xl text-foreground mb-4">{programTitle}</h3>
                  <p className="font-body text-muted-foreground leading-relaxed mb-8">{programText}</p>
                </>
              )}
              {extraSections}
              <h3 className="font-display text-2xl text-foreground mb-6">{t.courseTemplate.whatYouWillLearn}</h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {learnings.map((l) => (
                  <div key={l.title} className="bg-card border border-border rounded-xl p-5">
                    <h4 className="font-body font-semibold text-foreground text-sm mb-2">{l.title}</h4>
                    <p className="font-body text-muted-foreground text-xs leading-relaxed">{l.desc}</p>
                  </div>
                ))}
              </div>
              <h3 className="font-display text-2xl text-foreground mb-6">{t.courseTemplate.yourTarget}</h3>
              <div className="space-y-3 mb-10">
                {targets.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="text-primary mt-0.5 flex-shrink-0" size={18} />
                    <p className="font-body text-foreground text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <h3 className="font-display text-2xl text-foreground mb-6">{t.courseTemplate.dayInCamp}</h3>
              <p className="font-body text-sm text-muted-foreground mb-4">{scheduleLabel || "Structured training environment"}</p>
              <div className="space-y-2 mb-10">
                {schedule.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
                    <CalendarLucide className="text-primary flex-shrink-0" size={16} />
                    <p className="font-body text-foreground text-sm">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card border border-border rounded-2xl p-6">
                <h3 className="font-display text-2xl text-foreground mb-1">{sidebarTitle}</h3>
                <p className="font-display text-3xl text-primary mb-4">{price}</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="flex items-center gap-2"><Clock className="text-primary" size={14} /><span className="font-body text-xs text-foreground">{hours}</span></div>
                  <div className="flex items-center gap-2"><CalendarLucide className="text-primary" size={14} /><span className="font-body text-xs text-foreground">{duration}</span></div>
                  <div className="flex items-center gap-2"><Users className="text-primary" size={14} /><span className="font-body text-xs text-foreground">{level}</span></div>
                  <div className="flex items-center gap-2"><Target className="text-primary" size={14} /><span className="font-body text-xs text-foreground">{levelLabel}</span></div>
                </div>
                {days && (
                  <div className="mb-4">
                    <p className="font-body text-xs text-muted-foreground mb-1.5">{t.courseTemplate.chooseStartDate}</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn("w-full flex items-center gap-3 font-body text-sm px-4 py-3 rounded-lg border transition-colors text-left", selectedDate ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-border text-muted-foreground hover:border-primary/40")}>
                          <CalendarIcon size={16} />
                          {selectedDate ? (
                            <span>{format(selectedDate, "EEEE, MMM d")}{days > 1 && <> → {format(getEndDate(selectedDate), "EEEE, MMM d")}</>}</span>
                          ) : (
                            <span>{t.courseTemplate.selectDate}</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 border-b border-border">
                          <p className="font-body text-xs text-muted-foreground">{sidebarTitle}</p>
                          <p className="font-body text-sm font-semibold text-foreground">
                            {days === 5 ? t.courseTemplate.selectMonday : days === 3 ? t.courseTemplate.selectStartDay : t.courseTemplate.selectDay}
                          </p>
                        </div>
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={disabledDays} className={cn("p-3 pointer-events-auto")} />
                        {selectedDate && (
                          <div className="p-3 border-t border-border">
                            <p className="font-body text-xs text-foreground">
                              <strong>{format(selectedDate, "EEEE, MMM d")}</strong>
                              {days > 1 && <> → <strong>{format(getEndDate(selectedDate), "EEEE, MMM d")}</strong></>}
                            </p>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-body text-[10px] text-muted-foreground mb-1 block">{t.courseTemplate.name}</label>
                      <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 focus-within:border-primary/50 transition-colors">
                        <Users className="text-primary flex-shrink-0" size={14} />
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.courseTemplate.fullName} maxLength={100} className="bg-transparent font-body text-xs text-foreground placeholder:text-muted-foreground/50 outline-none w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="font-body text-[10px] text-muted-foreground mb-1 block">{t.courseTemplate.phone}</label>
                      <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 focus-within:border-primary/50 transition-colors">
                        <Phone className="text-primary flex-shrink-0" size={14} />
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.courseTemplate.phonePlaceholder} maxLength={20} className="bg-transparent font-body text-xs text-foreground placeholder:text-muted-foreground/50 outline-none w-full" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-[10px] text-muted-foreground mb-1 block">{t.courseTemplate.email}</label>
                    <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 focus-within:border-primary/50 transition-colors">
                      <Mail className="text-primary flex-shrink-0" size={14} />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.courseTemplate.emailPlaceholder} maxLength={255} className="bg-transparent font-body text-xs text-foreground placeholder:text-muted-foreground/50 outline-none w-full" />
                    </div>
                  </div>
                </div>
                <button onClick={handleBooking} className="block w-full bg-primary text-primary-foreground font-body font-bold text-center py-3 rounded-lg hover:bg-primary-foreground hover:text-primary transition-colors mb-2">
                  {t.courseTemplate.bookNow} — {price}
                </button>
                <Link to="/programs" className="block w-full border border-primary/30 text-foreground font-body font-medium text-center py-2.5 rounded-lg hover:border-primary transition-colors text-sm">
                  {t.courseTemplate.viewAllPrograms}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <MorePrograms />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default CoursePageTemplate;
