import { Link } from "react-router-dom";
import { useEffect } from "react";
import PublicBottomNav from "@/components/PublicBottomNav";
import PublicHeader from "@/components/PublicHeader";
import { ArrowRight } from "@phosphor-icons/react";
import { SearchIcon } from "@/components/ui/animated-icons/search";
import { CalendarDaysIcon } from "@/components/ui/animated-icons/calendar-days";
import { TrendingUpIcon } from "@/components/ui/animated-icons/trending-up";
import { UsersIcon } from "@/components/ui/animated-icons/users";
import { ShieldCheckIcon } from "@/components/ui/animated-icons/shield-check";
import { ZapIcon } from "@/components/ui/animated-icons/zap";
import { FeatureIconCard } from "@/components/ui/animated-icons/FeatureIconCard";
import heroPadel from "@/assets/hero-padel.jpg";
import featuresTennis from "@/assets/features-tennis.jpg";
import ctaCourt from "@/assets/cta-court.jpg";
import logoWhite from "@/assets/hi-volley-logo-white.png.asset.json";
import { BrandIcon, BrandLogo } from "@/components/BrandLogo";
import { setSeo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const { t, lang } = useI18n();

  const features = [
    { icon: SearchIcon, titleKey: "feat.find.title", descKey: "feat.find.desc" },
    { icon: CalendarDaysIcon, titleKey: "feat.book.title", descKey: "feat.book.desc" },
    { icon: TrendingUpIcon, titleKey: "feat.track.title", descKey: "feat.track.desc" },
    { icon: UsersIcon, titleKey: "feat.community.title", descKey: "feat.community.desc" },
    { icon: ShieldCheckIcon, titleKey: "feat.verified.title", descKey: "feat.verified.desc" },
    { icon: ZapIcon, titleKey: "feat.ai.title", descKey: "feat.ai.desc" },
  ] as const;

  const stats = [
    { value: "500+", labelKey: "stats.coaches" },
    { value: "10K+", labelKey: "stats.sessions" },
    { value: "50+", labelKey: "stats.cities" },
    { value: "4.9", labelKey: "stats.rating" },
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

      {/* Hero scene — yesterday's clay-court photo */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        <img
          src={heroPadel}
          alt="Tennis player sliding on a clay court to reach a ball"
          width={1536}
          height={1024}
          className="absolute inset-0 w-full h-full object-cover object-[64%_center]"
          loading="eager"
        />
        {/* keep the clay deep so white copy stays readable */}
        <div className="absolute inset-0 bg-background/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/25" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-20">
          <div className="max-w-xl">
            <img src={logoWhite.url} alt="Hi Volley" className="h-9 md:h-11 w-auto mb-10" loading="eager" />
            <p className="inline-flex items-center gap-2 font-body text-sm text-foreground/70 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t("home.badge")}
            </p>
            <h1 className="font-display text-[2.5rem] md:text-6xl lg:text-7xl leading-[0.95] mb-6 font-medium">
              {t("home.h1.line1")} <span className="text-primary">{t("home.h1.line2")}</span> {t("home.h1.line3")}
            </h1>
            <p className="font-body text-base md:text-lg text-foreground/75 mb-10">{t("home.lead")}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/find-a-coach" className="inline-flex items-center justify-center gap-2 font-body font-medium text-base bg-foreground text-background px-7 py-3.5 rounded-full hover:bg-foreground/90 transition-colors">
                {t("home.cta.find")} <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 font-body font-medium text-base border border-foreground/25 text-foreground px-7 py-3.5 rounded-full hover:bg-foreground/10 transition-colors">
                {t("home.cta.coach")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats on orange horizon glow */}
      <section className="relative py-16 px-6">
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(50% 60% at 50% 50%, hsl(var(--accent) / 0.14), transparent 100%)" }} />
        <div className="relative max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.labelKey}>
              <p className="font-display text-4xl md:text-5xl tabular-nums">{s.value}</p>
              <p className="font-body text-sm text-muted-foreground mt-2">{t(s.labelKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features with blue beam */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(40% 60% at 85% 0%, hsl(var(--primary) / 0.28), transparent 70%), radial-gradient(35% 40% at 5% 70%, hsl(var(--accent) / 0.10), transparent 100%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-16">
          <div className="lg:sticky lg:top-28 self-start">
            <BrandIcon className="h-11 w-11 mb-6" />
            <h2 className="font-display text-4xl md:text-5xl mb-4 leading-[1]">
              {t("features.h2.a")} <span className="text-primary">{t("features.h2.b")}</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-sm mb-8">{t("features.lead")}</p>
            <img
              src={featuresTennis}
              alt="Close-up of a tennis ball meeting the racquet strings"
              width={1920}
              height={1080}
              loading="lazy"
              className="hidden lg:block w-full aspect-[16/10] object-cover rounded-2xl ring-1 ring-foreground/[0.08]"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <FeatureIconCard key={f.titleKey} Icon={f.icon} title={t(f.titleKey)} description={t(f.descKey)} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(50% 70% at 10% 50%, hsl(var(--primary) / 0.16), transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl mb-14">
            {t("how.h2.a")} <span className="text-accent">{t("how.h2.b")}</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((item) => (
              <div key={item.step} className="rounded-2xl bg-card/60 p-6 ring-1 ring-foreground/[0.06]">
                <span className="font-display text-sm text-accent tabular-nums">{item.step}</span>
                <h3 className="font-display text-xl mt-6 mb-2">{t(item.titleKey)}</h3>
                <p className="font-body text-sm text-muted-foreground">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA scene — night padel court with light trails */}
      <section className="relative min-h-[70vh] flex items-center px-6 overflow-hidden">
        <img
          src={ctaCourt}
          alt="Padel court at night with light trails sweeping over the net"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
        <div className="relative z-10 max-w-7xl w-full mx-auto md:px-6">
          <div className="max-w-lg">
            <h2 className="font-display text-4xl md:text-6xl mb-4 leading-[1]">
              {t("cta.h2.a")} <span className="text-primary">{t("cta.h2.b")}</span> {t("cta.h2.c")}
            </h2>
            <p className="font-body text-foreground/75 mb-8">{t("cta.lead")}</p>
            <Link to="/login" className="inline-flex items-center gap-2 font-body font-medium text-base bg-accent text-accent-foreground px-7 py-3.5 rounded-full hover:bg-accent/90 transition-colors">
              {t("cta.btn")} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* SEO city cluster */}
      <section className="relative py-16 px-6">
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(50% 80% at 50% 0%, hsl(var(--primary) / 0.10), transparent 70%)" }} />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl mb-2">{t("seo.h2.a")} <span className="text-primary">{t("seo.h2.b")}</span></h2>
          <p className="font-body text-sm text-muted-foreground mb-8">{t("seo.lead")}</p>
          <div className="grid md:grid-cols-2 gap-8">
            {([
              ["seo.padel", ["madrid","barcelona","valencia","malaga","marbella","sevilla","palma","lisbon","milan","dubai"], "/es/profesor-de-padel/", "/padel-coach/"],
              ["seo.tennis", ["madrid","barcelona","paris","london","berlin","munich","milan","rome","miami","dubai"], "/es/profesor-de-tenis/", "/tennis-coach/"],
            ] as const).map(([key, cities, es, en]) => (
              <div key={key}>
                <p className="font-body text-sm text-muted-foreground mb-3">{t(key)}</p>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <Link key={c} to={(lang === "es" ? es : en) + c} className="px-3 py-1.5 text-sm font-body bg-card/60 ring-1 ring-foreground/[0.06] rounded-full hover:ring-primary/50 transition-colors capitalize">
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <BrandLogo className="h-6" />
          <p className="font-body text-xs text-muted-foreground">© {new Date().getFullYear()} Hi Volley. {t("footer.tagline")}</p>
        </div>
      </footer>
      <PublicBottomNav />
    </div>
  );
};

export default Index;
