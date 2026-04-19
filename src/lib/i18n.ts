// Lightweight i18n: no external dep, persisted to localStorage.
// Usage: const { t, lang, setLang } = useI18n();

import { useEffect, useState, useCallback } from "react";

export type Lang = "en" | "es";

const STORAGE_KEY = "ace_lang";

// All UI strings live here. Add a key, add an ES translation. Done.
const dict = {
  // Header / Nav
  "nav.find": { en: "FIND A COACH", es: "BUSCAR PROFESOR" },
  "nav.marketplace": { en: "MARKETPLACE", es: "MARKETPLACE" },
  "nav.events": { en: "EVENTS", es: "EVENTOS" },
  "nav.community": { en: "COMMUNITY", es: "COMUNIDAD" },
  "nav.login": { en: "LOG IN", es: "ENTRAR" },
  "nav.getStarted": { en: "GET STARTED", es: "EMPEZAR" },

  // Bottom nav
  "bn.home": { en: "Home", es: "Inicio" },
  "bn.training": { en: "Training", es: "Entreno" },
  "bn.events": { en: "Events", es: "Eventos" },
  "bn.community": { en: "Community", es: "Comunidad" },
  "bn.messages": { en: "Messages", es: "Mensajes" },

  // Homepage hero
  "home.badge": { en: "TENNIS & PADEL COACHING PLATFORM", es: "PLATAFORMA DE COACHING DE TENIS Y PÁDEL" },
  "home.h1.line1": { en: "FIND YOUR", es: "ENCUENTRA TU" },
  "home.h1.line2": { en: "PERFECT COACH", es: "PROFESOR PERFECTO" },
  "home.h1.line3": { en: "ANYWHERE", es: "EN CUALQUIER LUGAR" },
  "home.lead": {
    en: "The all-in-one platform for tennis & padel players to discover coaches, book sessions, track progress, and level up their game.",
    es: "La plataforma todo-en-uno para jugadores de tenis y pádel para encontrar profesores, reservar clases, seguir tu progreso y mejorar tu juego.",
  },
  "home.cta.find": { en: "FIND A COACH", es: "BUSCAR PROFESOR" },
  "home.cta.coach": { en: "I'M A COACH", es: "SOY PROFESOR" },

  // Stats
  "stats.coaches": { en: "COACHES", es: "PROFESORES" },
  "stats.sessions": { en: "SESSIONS", es: "CLASES" },
  "stats.cities": { en: "CITIES", es: "CIUDADES" },
  "stats.rating": { en: "AVG RATING", es: "VALORACIÓN MEDIA" },

  // Features
  "features.h2.a": { en: "EVERYTHING YOU", es: "TODO LO QUE" },
  "features.h2.b": { en: "NEED", es: "NECESITAS" },
  "features.lead": {
    en: "No other platform bundles all these features for racket sports. We're building the future of coaching.",
    es: "Ninguna otra plataforma reúne todas estas funciones para los deportes de raqueta. Estamos construyendo el futuro del coaching.",
  },
  "feat.find.title": { en: "FIND YOUR COACH", es: "ENCUENTRA TU PROFESOR" },
  "feat.find.desc": { en: "Search by sport, location, language, availability & price. Tennis or Padel — your perfect match awaits.", es: "Busca por deporte, ubicación, idioma, disponibilidad y precio. Tenis o pádel — tu match perfecto te espera." },
  "feat.book.title": { en: "BOOK INSTANTLY", es: "RESERVA AL INSTANTE" },
  "feat.book.desc": { en: "See real-time availability, pick your slot, pay securely. Group sessions, 1-on-1, kids training — all in one place.", es: "Consulta la disponibilidad en tiempo real, elige tu hora y paga seguro. Clases en grupo, individuales, infantiles — todo en un solo sitio." },
  "feat.track.title": { en: "TRACK PROGRESS", es: "SIGUE TU PROGRESO" },
  "feat.track.desc": { en: "Detailed dashboards with training stats, shot breakdowns, fitness metrics, and gamified rankings.", es: "Dashboards detallados con estadísticas de entrenamiento, desglose de golpes, métricas físicas y rankings gamificados." },
  "feat.community.title": { en: "JOIN THE COMMUNITY", es: "ÚNETE A LA COMUNIDAD" },
  "feat.community.desc": { en: "Events, group sessions, leaderboards, and a global network of players and coaches.", es: "Eventos, clases en grupo, rankings y una red global de jugadores y profesores." },
  "feat.verified.title": { en: "VERIFIED COACHES", es: "PROFESORES VERIFICADOS" },
  "feat.verified.desc": { en: "Certified pros with ratings, reviews, badges, and transparent pricing packages.", es: "Profesionales certificados con valoraciones, reseñas, insignias y bonos con precios transparentes." },
  "feat.ai.title": { en: "AI-POWERED PLANS", es: "PLANES CON IA" },
  "feat.ai.desc": { en: "Smart training modules for technique, fitness, mental game — tailored to your level.", es: "Módulos de entrenamiento inteligentes de técnica, físico y mental — adaptados a tu nivel." },

  // How it works
  "how.h2.a": { en: "HOW IT", es: "CÓMO" },
  "how.h2.b": { en: "WORKS", es: "FUNCIONA" },
  "how.1.title": { en: "SEARCH", es: "BUSCA" },
  "how.1.desc": { en: "Enter your city, sport, and preferences. Filter by language, price, availability, and coaching style.", es: "Introduce tu ciudad, deporte y preferencias. Filtra por idioma, precio, disponibilidad y estilo de enseñanza." },
  "how.2.title": { en: "BOOK", es: "RESERVA" },
  "how.2.desc": { en: "Pick a coach, choose a package or single session, select your time slot, and pay securely through the platform.", es: "Elige profesor, selecciona un bono o clase suelta, escoge horario y paga seguro a través de la plataforma." },
  "how.3.title": { en: "TRAIN", es: "ENTRENA" },
  "how.3.desc": { en: "Get personalized training plans, video analysis, progress tracking, and direct messaging with your coach.", es: "Recibe planes de entrenamiento personalizados, análisis en vídeo, seguimiento de progreso y mensajes directos con tu profesor." },
  "how.4.title": { en: "LEVEL UP", es: "SUBE DE NIVEL" },
  "how.4.desc": { en: "Track your improvement with stats, earn badges, climb the community rankings, and unlock new achievements.", es: "Sigue tu mejora con estadísticas, gana insignias, escala el ranking y desbloquea nuevos logros." },

  // CTA
  "cta.h2.a": { en: "READY TO", es: "¿LISTO PARA" },
  "cta.h2.b": { en: "ACE", es: "ACE" },
  "cta.h2.c": { en: "IT?", es: "ARRASAR?" },
  "cta.lead": {
    en: "Join thousands of players and coaches on the most complete racket sports platform ever built.",
    es: "Únete a miles de jugadores y profesores en la plataforma más completa de deportes de raqueta jamás creada.",
  },
  "cta.btn": { en: "GET STARTED FREE", es: "EMPIEZA GRATIS" },

  // SEO link cluster
  "seo.h2.a": { en: "FIND COACHES BY", es: "BUSCAR PROFESORES POR" },
  "seo.h2.b": { en: "CITY", es: "CIUDAD" },
  "seo.lead": { en: "Padel and tennis coaches in your city — also available in Spanish.", es: "Profesores de pádel y tenis en tu ciudad — también disponible en inglés." },
  "seo.padel": { en: "PADEL", es: "PÁDEL" },
  "seo.tennis": { en: "TENNIS", es: "TENIS" },

  // Footer
  "footer.tagline": { en: "The future of racket sports coaching.", es: "El futuro del coaching de deportes de raqueta." },
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
