// Lightweight i18n: no external dep, persisted to localStorage.
// Usage: const { t, lang, setLang } = useI18n();

import { useEffect, useState, useCallback } from "react";

export type Lang = "en" | "es";

const STORAGE_KEY = "ace_lang";

// All UI strings live here. Add a key, add an ES translation. Done.
const dict = {
  // Header / Nav
  "nav.find": { en: "Find a coach", es: "Buscar profesor" },
  "nav.marketplace": { en: "Marketplace", es: "Marketplace" },
  "nav.events": { en: "Events", es: "Eventos" },
  "nav.community": { en: "Community", es: "Comunidad" },
  "nav.login": { en: "Log in", es: "Entrar" },
  "nav.getStarted": { en: "Get started", es: "Empezar" },
  "nav.account": { en: "Account", es: "Cuenta" },

  // Bottom nav
  "bn.home": { en: "Home", es: "Inicio" },
  "bn.training": { en: "Training", es: "Entreno" },
  "bn.events": { en: "Events", es: "Eventos" },
  "bn.community": { en: "Community", es: "Comunidad" },
  "bn.messages": { en: "Messages", es: "Mensajes" },

  // Homepage hero
  "home.badge": { en: "Tennis and padel coaching", es: "Coaching de tenis y pádel" },
  "home.h1.line1": { en: "Train with", es: "Entrena con" },
  "home.h1.line2": { en: "a coach", es: "un profesor" },
  "home.h1.line3": { en: "who knows your game", es: "que conoce tu juego" },
  "home.lead": {
    en: "Find tennis and padel coaches near you, book a session and see your shots improve week by week.",
    es: "Encuentra profesores de tenis y pádel cerca de ti, reserva una clase y mira cómo mejoran tus golpes semana a semana.",
  },
  "home.cta.find": { en: "Find a coach", es: "Buscar profesor" },
  "home.cta.coach": { en: "I'm a coach", es: "Soy profesor" },

  // Stats
  "stats.coaches": { en: "Coaches", es: "Profesores" },
  "stats.sessions": { en: "Sessions", es: "Clases" },
  "stats.cities": { en: "Cities", es: "Ciudades" },
  "stats.rating": { en: "Average rating", es: "Valoración media" },

  // Features
  "features.h2.a": { en: "One place for", es: "Un sitio para" },
  "features.h2.b": { en: "your training", es: "tu entrenamiento" },
  "features.lead": {
    en: "Coaches, bookings, plans and progress for tennis and padel players.",
    es: "Profesores, reservas, planes y progreso para jugadores de tenis y pádel.",
  },
  "feat.find.title": { en: "Find a coach", es: "Encuentra profesor" },
  "feat.find.desc": { en: "Filter by sport, city, language, price and free slots.", es: "Filtra por deporte, ciudad, idioma, precio y horas libres." },
  "feat.book.title": { en: "Book a slot", es: "Reserva una hora" },
  "feat.book.desc": { en: "Private sessions, group classes and kids training, paid in the app.", es: "Clases individuales, en grupo e infantiles, pagadas en la app." },
  "feat.track.title": { en: "Track eight shots", es: "Sigue ocho golpes" },
  "feat.track.desc": { en: "Your coach rates each shot after a session, so you see the line move.", es: "Tu profesor valora cada golpe tras la clase y ves la evolución." },
  "feat.community.title": { en: "Events and clinics", es: "Eventos y clínics" },
  "feat.community.desc": { en: "Camps, tournaments and group clinics from coaches and clubs.", es: "Campus, torneos y clínics de profesores y clubes." },
  "feat.verified.title": { en: "Reviewed coaches", es: "Profesores con reseñas" },
  "feat.verified.desc": { en: "Ratings from real players and clear package prices.", es: "Valoraciones de jugadores reales y precios claros." },
  "feat.ai.title": { en: "Training plans", es: "Planes de entrenamiento" },
  "feat.ai.desc": { en: "Technique, fitness and mental blocks your coach builds for your level.", es: "Bloques de técnica, físico y mental adaptados a tu nivel." },

  // How it works
  "how.h2.a": { en: "How it", es: "Cómo" },
  "how.h2.b": { en: "works", es: "funciona" },
  "how.1.title": { en: "Search", es: "Busca" },
  "how.1.desc": { en: "Pick your city and sport, then filter by language, price and time.", es: "Elige ciudad y deporte, y filtra por idioma, precio y hora." },
  "how.2.title": { en: "Book", es: "Reserva" },
  "how.2.desc": { en: "Choose a single session or a package and pay in the app.", es: "Elige una clase suelta o un bono y paga en la app." },
  "how.3.title": { en: "Train", es: "Entrena" },
  "how.3.desc": { en: "Get a plan, video feedback and messages from your coach.", es: "Recibe un plan, feedback en vídeo y mensajes de tu profesor." },
  "how.4.title": { en: "Improve", es: "Mejora" },
  "how.4.desc": { en: "Your coach's ratings show how each shot develops over time.", es: "Las valoraciones de tu profesor muestran cómo evoluciona cada golpe." },

  // CTA
  "cta.h2.a": { en: "Ready to say", es: "¿Listo para decir" },
  "cta.h2.b": { en: "Hi Volley", es: "Hi Volley" },
  "cta.h2.c": { en: "", es: "?" },
  "cta.lead": {
    en: "Create a free account as a player or coach.",
    es: "Crea una cuenta gratis como jugador o profesor.",
  },
  "cta.btn": { en: "Get started", es: "Empezar" },

  // SEO link cluster
  "seo.h2.a": { en: "Coaches by", es: "Profesores por" },
  "seo.h2.b": { en: "city", es: "ciudad" },
  "seo.lead": { en: "Padel and tennis coaches in your city, in English and Spanish", es: "Profesores de pádel y tenis en tu ciudad, en inglés y español" },
  "seo.padel": { en: "Padel", es: "Pádel" },
  "seo.tennis": { en: "Tennis", es: "Tenis" },

  // Footer
  "footer.tagline": { en: "Tennis and padel coaching", es: "Coaching de tenis y pádel" },
} as const;

type DictKey = keyof typeof dict;

const detectInitial = (): Lang => {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored === "en" || stored === "es") return stored;
  // URL-based hint for ES routes
  if (window.location.pathname.startsWith("/es/")) return "es";
  // Browser language
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("es")) return "es";
  return "en";
};

let _listeners: Array<(l: Lang) => void> = [];
let _current: Lang = typeof window !== "undefined" ? detectInitial() : "en";

if (typeof window !== "undefined") {
  document.documentElement.lang = _current;
}

export const useI18n = () => {
  const [lang, setLangState] = useState<Lang>(_current);

  useEffect(() => {
    const cb = (l: Lang) => setLangState(l);
    _listeners.push(cb);
    return () => {
      _listeners = _listeners.filter((x) => x !== cb);
    };
  }, []);

  const setLang = useCallback((l: Lang) => {
    _current = l;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
    _listeners.forEach((cb) => cb(l));
  }, []);

  const t = useCallback(
    (key: DictKey): string => {
      const entry = dict[key];
      if (!entry) return key;
      return entry[lang] || entry.en;
    },
    [lang]
  );

  return { lang, setLang, t };
};
