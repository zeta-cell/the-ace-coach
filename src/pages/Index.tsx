import { Link } from "react-router-dom";
import { useEffect } from "react";
import PublicBottomNav from "@/components/PublicBottomNav";
import PublicHeader from "@/components/PublicHeader";
import { ArrowRight } from "@phosphor-icons/react";
import heroPadel from "@/assets/hero-padel.jpg";
import featuresTennis from "@/assets/features-tennis.jpg";
import ctaCourt from "@/assets/cta-court.jpg";
import tennisAction from "@/assets/events/tennis-player.jpg";
import clinicGroup from "@/assets/events/clinic-group.jpg";
import kidsCamp from "@/assets/events/kids-camp.jpg";
import tennisServe from "@/assets/events/tennis-serve.jpg";
import padelMatch from "@/assets/events/padel-match.jpg";
import tennisClay from "@/assets/events/tennis-clay.jpg";
import racketClay from "@/assets/events/racket-clay.jpg";
import fitnessStretch from "@/assets/events/fitness-stretch.jpg";
import drillsGear from "@/assets/events/drills-gear.jpg";
import { BrandLogo } from "@/components/BrandLogo";
import BlurText from "@/components/reactbits/BlurText";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightRow from "@/components/reactbits/SpotlightRow";
import { setSeo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const { t, lang } = useI18n();
  const L = (en: string, es: string) => (lang === "es" ? es : en);

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
              <Link to="/login" className="inline-flex items-center justify-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 active:scale-[0.98] transition-[background-color,transform]">
                {L("Create free account", "Crear cuenta gratis")} <ArrowRight size={18} />
              </Link>
              <Link to="/find-a-coach" className="inline-flex items-center justify-center font-body font-medium text-base text-foreground px-6 h-12 rounded-[10px] ring-1 ring-foreground/15 hover:bg-card transition-colors">
                {t("home.cta.find")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Facts strip: graphite band, coral count-ups, each fact drawn */}
      <section className="px-6 py-20 bg-foreground text-background">
        <div className="max-w-6xl mx-auto">
          <p className="font-body text-sm text-background/60 mb-10">{L("What's waiting inside", "Lo que te espera dentro")}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {([
              [8, "", L("shots tracked per player", "golpes medidos por jugador"), "shots"],
              [4, "", L("players per court slot", "jugadores por pista"), "court"],
              [2, "", L("sports, tennis and padel", "deportes, tenis y pádel"), "sports"],
              [0, "€", L("to create a player account", "para crear tu cuenta"), "free"],
            ] as const).map(([n, pre, l, kind]) => (
              <div key={l} className="border-t border-background/15 pt-6">
                <p className="font-display text-6xl md:text-7xl font-medium text-primary leading-none">
                  <CountUp to={n} prefix={pre} />
                </p>
                <p className="font-body text-sm text-background/75 mt-3 max-w-[14rem]">{l}</p>
                <div className="mt-5 h-6 flex items-center gap-1.5" aria-hidden>
                  {kind === "shots" && Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="w-1.5 rounded-full bg-primary" style={{ height: `${8 + ((i * 5) % 16)}px`, opacity: 0.4 + i * 0.075 }} />
                  ))}
                  {kind === "court" && (
                    <span className="grid grid-cols-2 gap-0.5 w-12 h-6 rounded-[4px] ring-1 ring-background/30 p-0.5">
                      {[0,1,2,3].map((i) => <span key={i} className={`rounded-[2px] ${i < 3 ? "bg-primary" : "bg-background/15"}`} />)}
                    </span>
                  )}
                  {kind === "sports" && <span className="font-body text-xs text-background/60">Tennis · Padel</span>}
                  {kind === "free" && <span className="font-body text-xs px-2 h-6 inline-flex items-center rounded-md bg-primary/15 text-primary">{L("No card needed", "Sin tarjeta")}</span>}
                </div>
              </div>
            ))}
          </div>
          <Link to="/login" className="mt-14 inline-flex items-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 active:scale-[0.98] transition-[background-color,transform]">
            {L("Create free account", "Crear cuenta gratis")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Mission split */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <img src={tennisAction} alt="Tennis player ready to return on court" loading="lazy" className="w-full h-[420px] object-cover rounded-2xl saturate-[0.85]" />
          <div>
            <span className="signature-bar mb-6" />
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] font-medium mb-6">
              {L("Your coach sees your game.", "Tu profesor ve tu juego.")} <span className="text-accent">{L("Now you do too", "Ahora tú también")}</span>
            </h2>
            <p className="font-body text-muted-foreground mb-8 max-w-md">
              {L("Every session your coach rates, every shot that improves and every booking you make lives in one place, so progress stops being a feeling and becomes a line you can follow.",
                 "Cada sesión que tu profesor evalúa, cada golpe que mejora y cada reserva viven en un solo lugar. El progreso deja de ser una sensación y se convierte en una línea que puedes seguir.")}
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 transition-colors">
              {L("Create free account", "Crear cuenta gratis")} <ArrowRight size={18} />
            </Link>
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

      {/* Services: four numbered panels */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <span className="signature-bar mb-6" />
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-12 max-w-2xl leading-[1.05]">{L("Four ways to play with us", "Cuatro formas de jugar")}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              [clinicGroup, L("Private coaching", "Clases privadas"), L("One coach, your shots, your pace", "Un profesor, tus golpes, tu ritmo"), "/find-a-coach"],
              [kidsCamp, L("Camps and clinics", "Campus y clínicas"), L("Group weeks with daily feedback", "Semanas en grupo con feedback diario"), "/events"],
              [tennisServe, L("Tournaments", "Torneos"), L("Draws, results and your record", "Cuadros, resultados y tu historial"), "/events"],
              [padelMatch, L("Academy access", "Academias"), L("Join your club's academy in one tap", "Únete a la academia de tu club"), "/login"],
            ].map(([img, title, desc, to], i) => (
              <Link key={title} to={to} className="group relative h-[380px] rounded-2xl overflow-hidden bg-foreground">
                <img src={img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-background">
                  <p className="font-body text-sm tabular-nums text-background/70">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="font-display text-2xl font-medium mt-2">{title}</h3>
                  <p className="font-body text-sm text-background/75 mt-1">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Booking teaser: a real-looking slot picker */}
      <section className="px-6 py-24 bg-card">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="signature-bar mb-6" />
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-[1.05] mb-6">{L("Pick a slot.", "Elige hora.")} <span className="text-accent">{L("You're on court", "Ya estás en pista")}</span></h2>
            <p className="font-body text-muted-foreground max-w-md mb-8">{L("See your coach's free hours, book in two taps and pay per session. No subscription.", "Mira las horas libres de tu profesor, reserva en dos toques y paga por sesión. Sin suscripción.")}</p>
            <Link to="/find-a-coach" className="inline-flex items-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 transition-colors">{L("Find a coach", "Buscar profesor")} <ArrowRight size={18} /></Link>
          </div>
          <div className="rounded-2xl bg-background p-6 ring-1 ring-foreground/10">
            <div className="flex items-baseline justify-between mb-6">
              <p className="font-display text-xl font-medium">{L("Thursday, 12 Nov", "Jueves, 12 nov")}</p>
              <p className="font-body text-sm text-muted-foreground">{L("Court 2 · 60 min", "Pista 2 · 60 min")}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["08:00","09:00","10:00","16:00","17:00","18:00","19:00","20:00","21:00"].map((h) => {
                const taken = ["09:00","17:00","20:00"].includes(h); const pick = h === "18:00";
                return <div key={h} className={`h-12 rounded-[10px] flex items-center justify-center font-body text-sm tabular-nums ${pick ? "bg-primary text-primary-foreground" : taken ? "bg-foreground/5 text-muted-foreground line-through" : "bg-card ring-1 ring-foreground/10"}`}>{h}</div>;
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-foreground/10 flex items-center justify-between font-body text-sm">
              <span className="text-muted-foreground">{L("Private session", "Sesión privada")}</span>
              <span className="font-medium tabular-nums">€45</span>
            </div>
          </div>
        </div>
      </section>

      {/* Progression ladder */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <span className="signature-bar mb-6" />
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-12 leading-[1.05]">{L("From first rally to match play", "Del primer peloteo a la competición")}</h2>
          <ol className="border-y border-foreground/10 divide-y divide-foreground/10">
            {[
              [L("Foundations", "Fundamentos"), L("Grip, footwork and a forehand you trust", "Empuñadura, pies y una derecha fiable")],
              [L("Rally builder", "Constructor de peloteo"), L("Consistency drills and your first ratings", "Ejercicios de regularidad y tus primeras notas")],
              [L("Match ready", "Listo para jugar"), L("Tactics, serve patterns and weekly plans", "Táctica, saque y planes semanales")],
              [L("Tournament", "Torneo"), L("Video review, load tracking and draws", "Vídeo, carga de entreno y cuadros")],
            ].map(([a, b], i) => (
              <li key={a} className="grid grid-cols-[48px_1fr] md:grid-cols-[80px_1fr_1.4fr] gap-4 py-6 items-baseline">
                <span className="font-body text-sm text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-2xl font-medium">{a}</h3>
                <p className="font-body text-muted-foreground col-start-2 md:col-start-auto">{b}</p>
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

      {/* Event spotlight */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.2fr_1fr] rounded-2xl overflow-hidden bg-foreground text-background">
          <img src={tennisClay} alt="Tennis match on a clay court" loading="lazy" className="w-full h-72 md:h-full object-cover" />
          <div className="p-10 md:p-12 flex flex-col justify-center">
            <p className="font-body text-sm text-background/70 mb-3">{L("Inside the app", "Dentro de la app")}</p>
            <h2 className="font-display text-4xl font-medium leading-[1.05] mb-4">{L("Camps, clinics and tournaments near you", "Campus, clínicas y torneos cerca de ti")}</h2>
            <p className="font-body text-background/75 mb-8">{L("Register, pay and chat with the group in one place. Past results stay on your profile.", "Inscríbete, paga y habla con el grupo en un solo lugar. Tus resultados quedan en tu perfil.")}</p>
            <Link to="/events" className="self-start inline-flex items-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 transition-colors">{L("See events", "Ver eventos")} <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      {/* Journal */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-10">{L("What you'll train inside", "Lo que entrenarás dentro")}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              [racketClay, L("Technique", "Técnica"), L("The bandeja, broken into four checkpoints", "La bandeja en cuatro puntos clave")],
              [fitnessStretch, L("Recovery", "Recuperación"), L("A ten-minute routine after every match", "Diez minutos después de cada partido")],
              [drillsGear, L("Drills", "Ejercicios"), L("Volley ladders your coach can assign", "Escaleras de volea que tu profesor asigna")],
            ].map(([img, tag, title]) => (
              <Link key={title} to="/login" className="group">
                <img src={img} alt="" loading="lazy" className="w-full h-56 object-cover rounded-2xl mb-4 saturate-[0.85]" />
                <p className="font-body text-sm text-muted-foreground">{tag}</p>
                <h3 className="font-display text-xl font-medium mt-1 group-hover:text-accent transition-colors">{title}</h3>
              </Link>
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
