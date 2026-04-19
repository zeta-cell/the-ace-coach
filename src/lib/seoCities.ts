// City × Sport data for programmatic SEO landing pages.
// Each city has slugs in EN + ES, hero copy, and FAQs.

export type Locale = "en" | "es";
export type Sport = "padel" | "tennis";

export type CitySeo = {
  slug: string;          // canonical city slug, lowercase
  name: string;          // human display
  country: string;       // ISO display
  countryCode: string;   // ISO-2
  lat: number;
  lng: number;
  population?: number;
};

export const CITIES: CitySeo[] = [
  { slug: "madrid", name: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4168, lng: -3.7038 },
  { slug: "barcelona", name: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.3874, lng: 2.1686 },
  { slug: "valencia", name: "Valencia", country: "Spain", countryCode: "ES", lat: 39.4699, lng: -0.3763 },
  { slug: "sevilla", name: "Sevilla", country: "Spain", countryCode: "ES", lat: 37.3891, lng: -5.9845 },
  { slug: "malaga", name: "Málaga", country: "Spain", countryCode: "ES", lat: 36.7213, lng: -4.4214 },
  { slug: "marbella", name: "Marbella", country: "Spain", countryCode: "ES", lat: 36.5101, lng: -4.8825 },
  { slug: "bilbao", name: "Bilbao", country: "Spain", countryCode: "ES", lat: 43.2630, lng: -2.9350 },
  { slug: "zaragoza", name: "Zaragoza", country: "Spain", countryCode: "ES", lat: 41.6488, lng: -0.8891 },
  { slug: "palma", name: "Palma de Mallorca", country: "Spain", countryCode: "ES", lat: 39.5696, lng: 2.6502 },
  { slug: "alicante", name: "Alicante", country: "Spain", countryCode: "ES", lat: 38.3452, lng: -0.4810 },
  { slug: "lisbon", name: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.7223, lng: -9.1393 },
  { slug: "porto", name: "Porto", country: "Portugal", countryCode: "PT", lat: 41.1579, lng: -8.6291 },
  { slug: "milan", name: "Milan", country: "Italy", countryCode: "IT", lat: 45.4642, lng: 9.1900 },
  { slug: "rome", name: "Rome", country: "Italy", countryCode: "IT", lat: 41.9028, lng: 12.4964 },
  { slug: "paris", name: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
  { slug: "london", name: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
  { slug: "berlin", name: "Berlin", country: "Germany", countryCode: "DE", lat: 52.5200, lng: 13.4050 },
  { slug: "munich", name: "Munich", country: "Germany", countryCode: "DE", lat: 48.1351, lng: 11.5820 },
  { slug: "dubai", name: "Dubai", country: "UAE", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
  { slug: "miami", name: "Miami", country: "United States", countryCode: "US", lat: 25.7617, lng: -80.1918 },
];

export const SPORTS: Sport[] = ["padel", "tennis"];

export const findCity = (slug: string) =>
  CITIES.find((c) => c.slug === slug.toLowerCase()) || null;

// ---------- Copy ----------

const COPY = {
  en: {
    padel: {
      h1: (city: string) => `Padel Coaches in ${city}`,
      lead: (city: string) =>
        `Find verified padel coaches in ${city}. Book lessons, group clinics and intensive courses with transparent pricing — and track your progress in one place.`,
      cta1: "Find a coach",
      cta2: "Become a coach",
      benefit1Title: "Verified coaches",
      benefit1: (city: string) => `Every coach in ${city} is profile-verified with ratings, certifications and pricing.`,
      benefit2Title: "Instant booking",
      benefit2: "See real-time availability and book individual lessons or group clinics in 60 seconds.",
      benefit3Title: "Track progress",
      benefit3: "Detailed dashboards with shot stats, weekly streaks and gamified ranking.",
      faq: (city: string) => [
        { q: `How much does a padel lesson cost in ${city}?`, a: `Private padel lessons in ${city} typically range from €25 to €60 per hour depending on the coach's experience and certifications. Group clinics start as low as €15 per person.` },
        { q: `Can I book a single lesson or do I need a package?`, a: `Both. ACE coaches offer single sessions, multi-week packages and recurring group programs. You only pay for what you book.` },
        { q: `How do I find the right padel coach for my level?`, a: `Filter by sport, language, level (beginner to advanced), price and availability. Each coach profile shows certifications, reviews and the typical player level they coach.` },
        { q: `Can I take padel lessons in English in ${city}?`, a: `Yes. Many ${city} coaches speak English, Spanish and other languages. Use the language filter on the coach search.` },
      ],
    },
    tennis: {
      h1: (city: string) => `Tennis Coaches in ${city}`,
      lead: (city: string) =>
        `Find certified tennis coaches in ${city}. Private lessons, junior development, adult clinics and tournament prep — book and track everything in one app.`,
      cta1: "Find a coach",
      cta2: "Become a coach",
      benefit1Title: "Certified pros",
      benefit1: (city: string) => `Verified tennis coaches in ${city} with ratings, video demos and clear pricing.`,
      benefit2Title: "Flexible scheduling",
      benefit2: "Real-time availability with morning, evening and weekend slots.",
      benefit3Title: "Personalized plans",
      benefit3: "Custom training plans, video feedback and progress tracking after every session.",
      faq: (city: string) => [
        { q: `How much do tennis lessons cost in ${city}?`, a: `Private tennis lessons in ${city} usually cost €30–€80 per hour. Group clinics and junior programs are more affordable per session.` },
        { q: `Do you offer tennis lessons for kids?`, a: `Yes. Many coaches specialize in junior development with age-appropriate drills and red/orange/green ball methodology.` },
        { q: `Can I book lessons at my own club?`, a: `Yes. ACE supports coaches who travel to your club, as well as coaches who teach at fixed locations.` },
        { q: `What if I need to cancel?`, a: `You can cancel free of charge up to 48 hours before the session. Cancellations within 48 hours follow the coach's policy.` },
      ],
    },
  },
  es: {
    padel: {
      h1: (city: string) => `Profesores de Pádel en ${city}`,
      lead: (city: string) =>
        `Encuentra profesores de pádel verificados en ${city}. Reserva clases particulares, clínics y cursos intensivos con precios transparentes — y sigue tu progreso en un solo sitio.`,
      cta1: "Buscar profesor",
      cta2: "Soy entrenador",
      benefit1Title: "Profesores verificados",
      benefit1: (city: string) => `Todos los profesores en ${city} están verificados con valoraciones, certificaciones y precios claros.`,
      benefit2Title: "Reserva al instante",
      benefit2: "Consulta la disponibilidad en tiempo real y reserva clases individuales o grupales en 60 segundos.",
      benefit3Title: "Sigue tu progreso",
      benefit3: "Dashboards detallados con estadísticas de golpe, rachas semanales y ranking gamificado.",
      faq: (city: string) => [
        { q: `¿Cuánto cuesta una clase de pádel en ${city}?`, a: `Las clases particulares de pádel en ${city} suelen costar entre 25€ y 60€ la hora, dependiendo de la experiencia y certificaciones del profesor. Las clínics grupales empiezan desde 15€ por persona.` },
        { q: `¿Puedo reservar una sola clase o necesito un bono?`, a: `Las dos opciones. Los profesores en ACE ofrecen clases sueltas, bonos de varias semanas y programas grupales recurrentes. Solo pagas lo que reservas.` },
        { q: `¿Cómo encuentro el profesor de pádel adecuado para mi nivel?`, a: `Filtra por deporte, idioma, nivel (principiante a avanzado), precio y disponibilidad. Cada perfil muestra certificaciones, reseñas y el nivel típico que entrena.` },
        { q: `¿Puedo dar clases de pádel en español en ${city}?`, a: `Sí. La mayoría de profesores en ${city} dan clases en español, y muchos también en inglés. Usa el filtro de idioma en la búsqueda.` },
      ],
    },
    tennis: {
      h1: (city: string) => `Profesores de Tenis en ${city}`,
      lead: (city: string) =>
        `Encuentra profesores de tenis certificados en ${city}. Clases particulares, escuela infantil, clínics para adultos y preparación para torneos — todo en una sola app.`,
      cta1: "Buscar profesor",
      cta2: "Soy entrenador",
      benefit1Title: "Profesionales certificados",
      benefit1: (city: string) => `Profesores de tenis verificados en ${city} con valoraciones, vídeos demo y precios claros.`,
      benefit2Title: "Horarios flexibles",
      benefit2: "Disponibilidad en tiempo real con clases de mañana, tarde y fin de semana.",
      benefit3Title: "Planes personalizados",
      benefit3: "Planes de entrenamiento a medida, feedback en vídeo y seguimiento del progreso tras cada sesión.",
      faq: (city: string) => [
        { q: `¿Cuánto cuestan las clases de tenis en ${city}?`, a: `Las clases particulares de tenis en ${city} suelen costar entre 30€ y 80€ la hora. Las clínics y la escuela infantil son más económicas por sesión.` },
        { q: `¿Hay clases de tenis para niños?`, a: `Sí. Muchos profesores se especializan en escuela infantil con metodología de bola roja, naranja y verde.` },
        { q: `¿Puedo dar clases en mi propio club?`, a: `Sí. ACE incluye profesores que se desplazan a tu club y profesores con instalaciones fijas.` },
        { q: `¿Qué pasa si tengo que cancelar?`, a: `Puedes cancelar sin coste hasta 48 horas antes de la clase. Las cancelaciones dentro de las 48 horas siguen la política del profesor.` },
      ],
    },
  },
};

export const getCopy = (locale: Locale, sport: Sport) => COPY[locale][sport];

// All combinations for sitemap and link grids
export const allCombos = () =>
  CITIES.flatMap((c) => SPORTS.flatMap((s) => (["en", "es"] as Locale[]).map((l) => ({ city: c, sport: s, locale: l }))));
