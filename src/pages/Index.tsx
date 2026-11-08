import { Link } from "react-router-dom";
import { useEffect } from "react";
import PublicBottomNav from "@/components/PublicBottomNav";
import PublicHeader from "@/components/PublicHeader";
import { ArrowRight } from "@phosphor-icons/react";
import heroPadel from "@/assets/hero-padel.jpg";
import featuresTennis from "@/assets/features-tennis.jpg";
import ctaCourt from "@/assets/cta-court.jpg";
import { BrandLogo } from "@/components/BrandLogo";
import BlurText from "@/components/reactbits/BlurText";
import SpotlightRow from "@/components/reactbits/SpotlightRow";
import ChromaHalo from "@/components/reactbits/ChromaHalo";
import { setSeo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const { t, lang } = useI18n();

  const features = [
    { titleKey: "feat.find.title", descKey: "feat.find.desc" },
    { titleKey: "feat.book.title", descKey: "feat.book.desc" },
    { titleKey: "feat.track.title", descKey: "feat.track.desc" },
    { titleKey: "feat.community.title", descKey: "feat.community.desc" },
    { titleKey: "feat.verified.title", descKey: "feat.verified.desc" },
    { titleKey: "feat.ai.title", descKey: "feat.ai.desc" },
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

      {/* Hero: clay-court photo graded into mist blue, headline on the calm left side */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-background">
        <img
          src={heroPadel}
          alt="Tennis player sliding on a clay court to reach a ball"
          width={1536}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover object-[70%_center] saturate-[0.85]"
          loading="eager"
        />
        {/* Mist blue enters from the top right; the player on the left stays clear */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 75% 85% at 100% 0%, hsl(var(--background)) 0%, hsl(var(--background) / 0.75) 35%, transparent 70%)" }} />
        <div className="absolute inset-y-0 left-0 w-full md:w-[48%] bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        <ChromaHalo />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-20">
          <div className="max-w-xl">
            <p className="font-body text-sm text-muted-foreground mb-3">{t("home.badge")}</p>
            <span className="signature-bar mb-8" />
            <h1 className="font-display text-[2.5rem] md:text-6xl leading-[1.02] mb-6 font-medium">
              <BlurText text={`${t("home.h1.line1")} ${t("home.h1.line2")}`} />{" "}
              <BlurText text={t("home.h1.line3")} delay={0.2} className="text-accent" />
            </h1>
            <p className="font-body text-base md:text-lg text-muted-foreground mb-10 max-w-md">{t("home.lead")}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/find-a-coach" className="inline-flex items-center justify-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 active:scale-[0.98] transition-[background-color,transform]">
                {t("home.cta.find")} <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center font-body font-medium text-base text-foreground px-6 h-12 rounded-[10px] ring-1 ring-foreground/15 hover:bg-card transition-colors">
                {t("home.cta.coach")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features: numbered list beside the racquet photo */}
      <section className="relative py-24 px-6 bg-card">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.3fr] gap-16">
          <div>
            <span className="signature-bar mb-6" />
            <h2 className="font-display text-4xl md:text-5xl mb-4 leading-[1.05] font-medium">
              {t("features.h2.a")} <span className="text-accent">{t("features.h2.b")}</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-sm">{t("features.lead")}</p>
            <img
              src={featuresTennis}
              alt="Close-up of a tennis ball meeting the racquet strings"
              width={1920}
              height={1080}
              loading="lazy"
              className="mt-10 hidden lg:block w-full h-[320px] object-cover rounded-2xl saturate-[0.8]"
            />
          </div>
          <ol className="divide-y divide-foreground/10 border-y border-foreground/10">
            {features.map((f, i) => (
              <li key={f.titleKey}>
                <SpotlightRow className="grid grid-cols-[48px_1fr] gap-4 py-6 px-2">
                  <span className="font-body text-sm text-muted-foreground tabular-nums pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-xl font-medium mb-1">{t(f.titleKey)}</h3>
                    <p className="font-body text-sm text-muted-foreground">{t(f.descKey)}</p>
                  </div>
                </SpotlightRow>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How it works: one graphite contrast band */}
      <section className="relative py-24 px-6 bg-foreground text-background">
        <div className="max-w-6xl mx-auto">
          <span className="signature-bar mb-6" />
          <h2 className="font-display text-4xl md:text-5xl mb-12 font-medium">
            {t("how.h2.a")} {t("how.h2.b")}
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="border-t border-background/15 pt-6">
                <span className="font-body text-sm tabular-nums text-primary">{item.step}</span>
                <h3 className="font-display text-xl mt-4 mb-2 font-medium">{t(item.titleKey)}</h3>
                <p className="font-body text-sm text-background/70">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA scene: night court photo, mist blue panel */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 rounded-2xl overflow-hidden bg-card">
          <div className="p-10 md:p-14 flex flex-col justify-center">
            <h2 className="font-display text-4xl md:text-5xl mb-4 leading-[1.05] font-medium">
              {t("cta.h2.a")} <span className="text-accent">{t("cta.h2.b")}</span>{t("cta.h2.c")}
            </h2>
            <p className="font-body text-muted-foreground mb-8">{t("cta.lead")}</p>
            <Link to="/login" className="self-start inline-flex items-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 transition-colors">
              {t("cta.btn")} <ArrowRight size={18} />
            </Link>
          </div>
          <img
            src={ctaCourt}
            alt="Padel court at night with light trails sweeping over the net"
            width={1920}
            height={1080}
            className="w-full h-64 md:h-full object-cover"
            loading="lazy"
          />
        </div>
      </section>

      {/* SEO city cluster */}
      <section className="relative pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl mb-2 font-medium">{t("seo.h2.a")} {t("seo.h2.b")}</h2>
          <p className="font-body text-sm text-muted-foreground mb-8">{t("seo.lead")}</p>
          <div className="grid md:grid-cols-2 gap-8">
            {([
              ["seo.padel", ["madrid","barcelona","valencia","malaga","marbella","sevilla","palma","lisbon","milan","dubai"], "/es/profesor-de-padel/", "/padel-coach/"],
              ["seo.tennis", ["madrid","barcelona","paris","london","berlin","munich","milan","rome","miami","dubai"], "/es/profesor-de-tenis/", "/tennis-coach/"],
            ] as const).map(([key, cities, es, en]) => (
              <div key={key}>
                <p className="font-body text-sm font-medium mb-3">{t(key)}</p>
                <div className="flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <Link key={c} to={(lang === "es" ? es : en) + c} className="px-3 h-8 inline-flex items-center text-sm font-body bg-card rounded-lg hover:bg-secondary transition-colors capitalize">
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-foreground/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <BrandLogo className="h-6" />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-body text-sm text-muted-foreground">
            <Link to="/find-a-coach" className="hover:text-foreground transition-colors">{t("home.cta.find")}</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">{t("home.cta.coach")}</Link>
            <Link to="/events" className="hover:text-foreground transition-colors">{t("nav.events")}</Link>
          </div>
          <p className="font-body text-xs text-muted-foreground">© {new Date().getFullYear()} Hi Volley · {t("footer.tagline")}</p>
        </div>
      </footer>
      <PublicBottomNav />
    </div>
  );
};

export default Index;
