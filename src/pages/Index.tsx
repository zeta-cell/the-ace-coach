import { Link } from "react-router-dom";
import { useEffect } from "react";
import PublicBottomNav from "@/components/PublicBottomNav";
import PublicHeader from "@/components/PublicHeader";
import { motion } from "framer-motion";
import { Search, Calendar, Shield, Users, Trophy, Zap, MapPin, ArrowRight } from "lucide-react";
import heroPadel from "@/assets/hero-padel.jpg";
import featuresTennis from "@/assets/features-tennis.jpg";
import ctaCourt from "@/assets/cta-court.jpg";
import { setSeo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const { t, lang } = useI18n();

  const features = [
    { icon: Search, titleKey: "feat.find.title", descKey: "feat.find.desc" },
    { icon: Calendar, titleKey: "feat.book.title", descKey: "feat.book.desc" },
    { icon: Trophy, titleKey: "feat.track.title", descKey: "feat.track.desc" },
    { icon: Users, titleKey: "feat.community.title", descKey: "feat.community.desc" },
    { icon: Shield, titleKey: "feat.verified.title", descKey: "feat.verified.desc" },
    { icon: Zap, titleKey: "feat.ai.title", descKey: "feat.ai.desc" },
  ] as const;

  const stats = [
    { value: "500+", labelKey: "stats.coaches" },
    { value: "10K+", labelKey: "stats.sessions" },
    { value: "50+", labelKey: "stats.cities" },
    { value: "4.9★", labelKey: "stats.rating" },
  ] as const;

  const steps = [
    { step: "01", titleKey: "how.1.title", descKey: "how.1.desc" },
    { step: "02", titleKey: "how.2.title", descKey: "how.2.desc" },
    { step: "03", titleKey: "how.3.title", descKey: "how.3.desc" },
    { step: "04", titleKey: "how.4.title", descKey: "how.4.desc" },
  ] as const;

  useEffect(() => {
    const isEs = lang === "es";
    setSeo({
      title: isEs
        ? "Hi Volley – Profesores de Tenis y Pádel, Reservas y Entrenos"
        : "Hi Volley – Tennis & Padel Coaches, Booking & Training",
      description: isEs
        ? "Encuentra profesores de tenis y pádel verificados, reserva clases al instante, sigue programas de entrenamiento y monitoriza tu progreso. Jugadores, profesores y clubes en Hi Volley."
        : "Find verified tennis & padel coaches, book sessions instantly, follow training programs and track your progress. Players, coaches and clubs on Hi Volley.",
      path: "/",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Hi Volley",
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        description: isEs
          ? "Hi Volley: la plataforma de coaching de tenis y pádel. Encuentra profesores, reserva clases, sigue planes de entrenamiento y participa en eventos."
          : "Hi Volley: tennis and padel coaching platform. Find coaches, book sessions, follow training plans, join events.",
      },
    });
  }, [lang]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <PublicHeader />

      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-end">
        <img
          src={heroPadel}
          alt="Padel player mid-swing on clay court"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/30 via-transparent to-background/40" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-10 pt-28 md:pb-[6.18rem] md:pt-40">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-body text-xs tracking-wider mb-10 shadow-lg">
              <MapPin size={14} /> {t("home.badge")}
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.95] mb-[1.618rem] [text-shadow:0_2px_20px_hsl(var(--navy)/0.35)]">
              {t("home.h1.line1")}
              <br />
              <span className="text-primary">{t("home.h1.line2")}</span>
              <br />
              {t("home.h1.line3")}
            </h1>
            <p className="font-body text-base md:text-xl text-foreground/90 max-w-2xl mb-8 md:mb-[2.618rem] [text-shadow:0_1px_10px_hsl(var(--navy)/0.3)]">
              {t("home.lead")}
            </p>
            <div className="flex flex-row gap-3 sm:gap-4">
              <Link
                to="/find-a-coach"
                className="inline-flex items-center justify-center gap-2 font-display text-sm tracking-widest bg-primary text-primary-foreground px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors w-full sm:w-auto"
              >
                {t("home.cta.find")} <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center justify-center gap-2 font-display text-sm tracking-widest bg-foreground/10 text-foreground px-8 py-4 rounded-xl hover:bg-foreground/20 transition-colors backdrop-blur-sm"
              >
                {t("home.cta.coach")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.labelKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-3xl md:text-4xl text-primary">{s.value}</p>
              <p className="font-body text-xs text-muted-foreground tracking-wider mt-1">{t(s.labelKey)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-6 overflow-hidden">
        <img
          src={featuresTennis}
          alt="Tennis racket close-up"
          className="absolute inset-0 w-full h-full object-cover opacity-15"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/80" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              {t("features.h2.a")} <span className="text-primary">{t("features.h2.b")}</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-xl mx-auto">{t("features.lead")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-card/70 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display text-lg tracking-wider mb-2">{t(f.titleKey)}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-card/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl text-center mb-16"
          >
            {t("how.h2.a")} <span className="text-primary">{t("how.h2.b")}</span>
          </motion.h2>

          <div className="space-y-0">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 py-8 border-b border-border last:border-0"
              >
                <span className="font-display text-4xl text-primary/30 shrink-0">{item.step}</span>
                <div>
                  <h3 className="font-display text-xl tracking-wider mb-1">{t(item.titleKey)}</h3>
                  <p className="font-body text-sm text-muted-foreground">{t(item.descKey)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 px-6 overflow-hidden">
        <img
          src={ctaCourt}
          alt="Padel court at night with dramatic lighting"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-4xl md:text-6xl mb-4">
              {t("cta.h2.a")} <span className="text-primary">{t("cta.h2.b")}</span> {t("cta.h2.c")}
            </h2>
            <p className="font-body text-muted-foreground mb-8 max-w-lg mx-auto">{t("cta.lead")}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-display text-sm tracking-widest bg-primary text-primary-foreground px-10 py-4 rounded-xl hover:bg-primary/90 transition-colors"
            >
              {t("cta.btn")} <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SEO city cluster */}
      <section className="border-t border-border py-14 px-6 bg-card/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl mb-2">{t("seo.h2.a")} <span className="text-primary">{t("seo.h2.b")}</span></h2>
          <p className="font-body text-sm text-muted-foreground mb-6">{t("seo.lead")}</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="font-display text-xs tracking-widest text-muted-foreground mb-3">{t("seo.padel")}</p>
              <div className="flex flex-wrap gap-2">
                {["madrid","barcelona","valencia","malaga","marbella","sevilla","palma","lisbon","milan","dubai"].map((c) => (
                  <Link
                    key={c}
                    to={lang === "es" ? `/es/profesor-de-padel/${c}` : `/padel-coach/${c}`}
                    className="px-3 py-1.5 text-xs font-body border border-border rounded-full hover:border-primary/50 capitalize"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="font-display text-xs tracking-widest text-muted-foreground mb-3">{t("seo.tennis")}</p>
              <div className="flex flex-wrap gap-2">
                {["madrid","barcelona","paris","london","berlin","munich","milan","rome","miami","dubai"].map((c) => (
                  <Link
                    key={c}
                    to={lang === "es" ? `/es/profesor-de-tenis/${c}` : `/tennis-coach/${c}`}
                    className="px-3 py-1.5 text-xs font-body border border-border rounded-full hover:border-primary/50 capitalize"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg tracking-wider inline-flex items-center gap-1.5">
            <span className="text-primary">Hi</span>
            <span>Volley</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-mustard" aria-hidden />
          </span>
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hi Volley. {t("footer.tagline")}
          </p>
        </div>
      </footer>
      <PublicBottomNav />
    </div>
  );
};

export default Index;
