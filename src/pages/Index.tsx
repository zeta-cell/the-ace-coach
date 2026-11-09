import { Link } from "react-router-dom";
import { useEffect } from "react";
import PublicBottomNav from "@/components/PublicBottomNav";
import PublicHeader from "@/components/PublicHeader";
import { ArrowRight } from "@phosphor-icons/react";
import heroPadel from "@/assets/hero-padel.jpg";
import heroBlue from "@/assets/features-tennis.jpg";
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
import logoWhite from "@/assets/hi-volley-logo-white.png.asset.json";
import BlurText from "@/components/reactbits/BlurText";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightRow from "@/components/reactbits/SpotlightRow";
import { setSeo } from "@/lib/seo";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

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


  const chip = "h-8 px-3 inline-flex items-center rounded-lg font-body text-xs tabular-nums";
  const previews = [
    <div className="w-full flex items-center gap-3 rounded-xl bg-card p-3">
      <span className="w-10 h-10 rounded-full bg-foreground text-background font-display flex items-center justify-center">PS</span>
      <div className="flex-1"><p className="font-body text-sm font-medium">Pedro Sousa</p><p className="font-body text-xs text-muted-foreground">Padel · EN ES · Elite</p></div>
      <span className="font-body text-sm font-medium tabular-nums">€45</span>
    </div>,
    <div className="flex flex-wrap gap-2">
      {["09:00","10:00","17:00","18:00","19:00"].map((h) => <span key={h} className={`${chip} ${h === "18:00" ? "bg-primary text-primary-foreground" : h === "10:00" ? "bg-foreground/5 text-muted-foreground line-through" : "bg-card"}`}>{h}</span>)}
    </div>,
    <div className="w-full flex items-end gap-2 h-full">
      {[["Forehand",72],["Backhand",58],["Serve",64],["Volley",81],["Smash",49],["Bandeja",67],["Vibora",55],["Lob",70]].map(([n,v]) => (
        <div key={n as string} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className={`w-full rounded-md ${n === "Volley" ? "bg-primary" : "bg-foreground/15"}`} style={{ height: `${v}%` }} />
          <span className="font-body text-[11px] text-muted-foreground hidden sm:block">{n}</span>
        </div>
      ))}
    </div>,
    <div className="w-full rounded-xl bg-card p-3 flex items-center justify-between">
      <div><p className="font-body text-sm font-medium">{L("Winter clinic", "Clínica de invierno")}</p><p className="font-body text-xs text-muted-foreground">{L("Sat 14 Nov · 6 of 8 spots", "Sáb 14 nov · 6 de 8 plazas")}</p></div>
      <div className="flex gap-1">{Array.from({ length: 8 }).map((_, k) => <span key={k} className={`w-2 h-2 rounded-full ${k < 6 ? "bg-primary" : "bg-foreground/15"}`} />)}</div>
    </div>,
    <div className="w-full rounded-xl bg-card p-3">
      <p className="font-display text-3xl font-medium tabular-nums">4.9<span className="font-body text-sm text-muted-foreground ml-2">{L("from 38 players", "de 38 jugadores")}</span></p>
      <div className="mt-2 h-1.5 rounded-full bg-foreground/10"><div className="h-full w-[96%] rounded-full bg-primary" /></div>
    </div>,
    <div className="w-full space-y-2">
      {[L("Warm-up · 10 min","Calentamiento · 10 min"), L("Volley ladder · 20 min","Escalera de volea · 20 min"), L("Cool-down · 5 min","Vuelta a la calma · 5 min")].map((r, k) => (
        <div key={r} className="flex items-center gap-2 font-body text-xs"><span className={`w-1 h-4 rounded-full ${k === 1 ? "bg-primary" : "bg-foreground/20"}`} />{r}</div>
      ))}
    </div>,
  ];

  const steps = [
    { titleKey: "how.1.title", descKey: "how.1.desc" },
    { titleKey: "how.2.title", descKey: "how.2.desc" },
    { titleKey: "how.3.title", descKey: "how.3.desc" },
    { titleKey: "how.4.title", descKey: "how.4.desc" },
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

      {/* Hero: deep-blue motion-blur photo, text sits in the naturally dark lower-left. No shadows, no overlays. */}
      <section className="relative overflow-hidden bg-background">
        <div className="relative h-[70svh] md:min-h-[100svh]">
          <img
            src={heroBlue}
            alt="Tennis racket striking a ball in motion over a blue court"
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
          />

          <div className="relative z-10 flex h-full items-end px-6 pt-20 pb-24 md:px-12 md:pt-28 md:pb-20">
            <div className="mx-auto w-full max-w-7xl">
              <div className="max-w-[40rem]">
                <p className="font-body text-sm text-background/80 mb-3">{t("home.badge")}</p>
                <span className="signature-bar mb-6" />
                <h1 className="font-display text-[2.1rem] md:text-[3.5rem] leading-[1.03] font-medium text-background">
                  <BlurText text={`${t("home.h1.line1")} ${t("home.h1.line2")}`} />{" "}
                  <BlurText text={t("home.h1.line3")} delay={0.2} className="text-primary" />
                </h1>
                <p className="mt-5 max-w-[30rem] font-body text-sm md:text-base text-background/80">{t("home.lead")}</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/login" className="inline-flex items-center justify-center gap-2 font-body font-medium text-base bg-background text-foreground px-6 h-12 rounded-[10px] hover:bg-background/90 active:scale-[0.98] transition-[background-color,transform]">
                    {L("Create free account", "Crear cuenta gratis")} <ArrowRight size={18} />
                  </Link>
                  <Link to="/find-a-coach" className="inline-flex items-center justify-center font-body font-medium text-base text-background px-6 h-12 rounded-[10px] ring-1 ring-background/45 hover:bg-background/10 transition-colors">
                    {t("home.cta.find")}
                  </Link>
                </div>
              </div>
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
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.6fr] gap-12">
          <div>
            <span className="signature-bar mb-6" />
            <h2 className="font-display text-4xl md:text-5xl mb-4 leading-[1.05] font-medium">
              {t("features.h2.a")} <span className="text-accent">{t("features.h2.b")}</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-sm">{t("features.lead")}</p>
            <img
              src={heroPadel}
              alt="Tennis player sliding across a clay court to reach a ball"
              width={1920}
              height={1080}
              loading="lazy"
              className="mt-10 hidden lg:block w-full h-[320px] object-cover rounded-2xl saturate-[0.8]"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <SpotlightRow key={f.titleKey} className={`rounded-2xl bg-background p-6 ring-1 ring-foreground/10 flex flex-col ${i === 2 ? "sm:col-span-2" : ""}`}>
                <div className="h-28 mb-6 flex items-end" aria-hidden>{previews[i]}</div>
                <h3 className="font-display text-2xl font-medium mb-1">{t(f.titleKey)}</h3>
                <p className="font-body text-sm text-muted-foreground">{t(f.descKey)}</p>
              </SpotlightRow>
            ))}
          </div>
        </div>
      </section>

      {/* Playing opportunities: clear photography and an account-first invitation */}
      <section className="px-6 py-20 md:py-24" aria-labelledby="play-heading">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-16 items-end mb-10">
            <div>
              <span className="signature-bar mb-6" />
              <h2 id="play-heading" className="font-display text-4xl md:text-5xl font-medium leading-[1.05]">{L("More reasons to", "Más razones para")} <span className="text-accent">{L("get on court", "salir a pista")}</span></h2>
            </div>
            <div>
              <p className="font-body text-muted-foreground mb-5 max-w-md">{L("A coach who gets your game. A group to train with. A match to look forward to. Find your next reason to play with Hi Volley.", "Un profesor que entiende tu juego. Un grupo con el que entrenar. Un partido que esperas con ganas. Encuentra tu próxima razón para jugar con Hi Volley.")}</p>
              <Button asChild size="lg" className="font-body h-12 px-6">
                <Link to="/login">{L("Create free account", "Crear cuenta gratis")} <ArrowRight size={18} /></Link>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-[1.15fr_1fr] gap-6 md:gap-10 items-center mb-12">
            <img src={clinicGroup} alt="Players gathered around their coach on court" loading="lazy" className="w-full aspect-[16/10] object-cover rounded-lg" />
            <div className="md:py-6">
              <p className="font-body text-sm text-accent mb-3">{L("Private coaching", "Clases privadas")}</p>
              <h3 className="font-display text-3xl md:text-4xl font-medium leading-[1.1] mb-4">{L("Make it your game", "Hazlo tuyo")}</h3>
              <p className="font-body text-muted-foreground mb-6 max-w-sm">{L("Work on the shots that matter to you, at your pace. Keep your coach’s feedback and see how your game develops in your player profile.", "Trabaja los golpes que te importan, a tu ritmo. Guarda el feedback de tu profesor y sigue tu evolución en tu perfil de jugador.")}</p>
              <Button asChild variant="link" className="p-0 h-11 text-foreground hover:text-accent font-body">
                <Link to="/find-a-coach">{L("Meet your coach", "Encuentra tu profesor")} <ArrowRight size={18} /></Link>
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {[
              [kidsCamp, L("Camps and clinics", "Campus y clínicas"), L("Train together. Take more home", "Entrena en grupo. Llévate más"), L("Meet other players, practise together and keep your coach’s feedback after camp ends.", "Conoce a otros jugadores, practica en grupo y guarda el feedback de tu profesor al terminar el campus."), L("Explore camps and clinics", "Explorar campus y clínicas"), "/events", "Young tennis player practising a forehand"],
              [tennisServe, L("Tournaments", "Torneos"), L("Give your training a match day", "Pon fecha a tu próximo partido"), L("Find a tournament to play in and keep your results alongside your training progress.", "Encuentra un torneo y guarda tus resultados junto a tu progreso de entrenamiento."), L("Find a tournament", "Buscar un torneo"), "/events", "Tennis racket and ball on a clay court"],
              [padelMatch, L("Academy access", "Academias"), L("Find your people on court", "Encuentra tu gente en pista"), L("Connect with your academy, its coaches and the sessions that bring you back to court.", "Conecta con tu academia, sus profesores y las sesiones que te hacen volver a pista."), L("Join Hi Volley", "Unirme a Hi Volley"), "/login", "Padel players sharing a court"],
            ].map(([img, category, title, desc, action, to, alt]) => (
              <article key={category} className="flex flex-col min-w-0">
                <img src={img} alt={alt} loading="lazy" className="w-full aspect-[4/3] object-cover rounded-lg mb-5" />
                <div className="flex flex-col flex-1">
                  <p className="font-body text-sm text-muted-foreground mb-2">{category}</p>
                  <h3 className="font-display text-2xl font-medium leading-tight mb-3">{title}</h3>
                  <p className="font-body text-sm text-muted-foreground mb-4">{desc}</p>
                  <Button asChild variant="link" className="self-start mt-auto p-0 h-11 text-foreground hover:text-accent font-body whitespace-normal text-left">
                    <Link to={to}>{action} <ArrowRight size={18} /></Link>
                  </Button>
                </div>
              </article>
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

      {/* Membership: what your account keeps from the first session */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
          <div className="rounded-3xl bg-foreground text-background p-8 md:p-10 ring-1 ring-foreground/10">
            <div className="flex items-center justify-between mb-10">
              <img src={logoWhite.url} alt="Hi Volley" className="h-6 w-auto" />
              <span className="font-body text-xs px-2.5 h-7 inline-flex items-center rounded-md bg-primary/15 text-primary">
                {L("Member", "Miembro")}
              </span>
            </div>
            <p className="font-display text-4xl md:text-5xl font-medium leading-none">Anna K.</p>
            <p className="font-body text-sm text-background/60 mt-3">{L("Tennis · Padel · Madrid", "Tenis · Pádel · Madrid")}</p>
            <div className="mt-9 grid grid-cols-3 gap-4">
              {[
                ["8", L("shots tracked", "golpes medidos")],
                ["12", L("sessions played", "sesiones jugadas")],
                ["18:00", L("next · Thu", "próxima · jue")],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl font-medium tabular-nums text-primary">{v}</p>
                  <p className="font-body text-xs text-background/60 mt-1">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-9 flex items-center gap-3">
              <span className="signature-bar" />
              <span className="font-body text-xs text-background/55">{L("Sample account", "Cuenta de ejemplo")}</span>
            </div>
          </div>

          <div>
            <span className="signature-bar mb-6" />
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-[1.05] mb-6">
              {L("Your game,", "Tu juego,")} <span className="text-accent">{L("on record", "anotado")}</span> {L("from the first session", "desde la primera sesión")}
            </h2>
            <p className="font-body text-muted-foreground max-w-md mb-8">
              {L(
                "Create an account and everything your coach does for you is saved in one place: your eight shots, your bookings, the notes on your videos and your results in clinics and tournaments.",
                "Crea una cuenta y todo lo que tu profesor hace por ti queda en un solo lugar: tus ocho golpes, tus reservas, las notas de tus vídeos y tus resultados en clínicas y torneos.",
              )}
            </p>
            <div className="space-y-5 mb-9">
              {[
                [L("Your eight shots, measured", "Tus ocho golpes, medidos"), L("Rated by your coach after every session", "Tu profesor los valora en cada sesión")],
                [L("Bookings, notes and videos together", "Reservas, notas y vídeos juntos"), L("One place instead of four chats", "Un solo sitio en vez de cuatro chats")],
                [L("Clinics and tournaments in a tap", "Clínicas y torneos en un toque"), L("See the spots left and join the group", "Mira las plazas libres y entra en el grupo")],
              ].map(([a, b]) => (
                <div key={a} className="flex gap-4">
                  <span className="signature-bar mt-2.5 shrink-0" />
                  <div>
                    <p className="font-body font-medium">{a}</p>
                    <p className="font-body text-sm text-muted-foreground">{b}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 active:scale-[0.98] transition-[background-color,transform]">
              {L("Create free account", "Crear cuenta gratis")} <ArrowRight size={18} />
            </Link>
            <p className="mt-3 font-body text-xs text-muted-foreground">{L("No card needed · no subscription", "Sin tarjeta · sin suscripción")}</p>
          </div>
        </div>
      </section>

      {/* Member pitch: one graphite contrast band, no step sequence */}
      <section className="relative py-24 px-6 bg-foreground text-background">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <span className="signature-bar mb-6" />
            <h2 className="font-display text-4xl md:text-5xl mb-6 font-medium leading-[1.05]">
              {L("One free account. Your whole game in one place.", "Una cuenta gratis. Todo tu juego en un solo lugar.")}
            </h2>
            <p className="font-body text-background/70 mb-8 max-w-md">
              {L("Coaches, bookings, training plans and your progress on eight shots — all of it lives in your profile from day one.", "Profesores, reservas, planes de entreno y tu progreso en ocho golpes — todo vive en tu perfil desde el primer día.")}
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 font-body font-medium text-base bg-primary text-primary-foreground px-6 h-12 rounded-[10px] hover:bg-primary/90 active:scale-[0.98] transition-[background-color,transform]">
              {L("Create free account", "Crear cuenta gratis")} <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {steps.map((item) => (
              <div key={item.titleKey} className="rounded-2xl bg-background/5 border border-background/10 p-5">
                <span className="signature-bar" />
                <h3 className="font-display text-lg mt-3 mb-1.5 font-medium">{t(item.titleKey)}</h3>
                <p className="font-body text-xs text-background/60 leading-relaxed">{t(item.descKey)}</p>
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
