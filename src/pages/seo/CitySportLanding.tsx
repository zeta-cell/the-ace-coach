import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Search, Calendar, Trophy, Star, Globe } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicBottomNav from "@/components/PublicBottomNav";
import { setSeo, SITE } from "@/lib/seo";
import { CITIES, SPORTS, findCity, getCopy, type Locale, type Sport } from "@/lib/seoCities";
import { supabase } from "@/integrations/supabase/client";

type Props = { locale: Locale; sport: Sport };

const PATH_PREFIX: Record<Locale, Record<Sport, string>> = {
  en: { padel: "/padel-coach", tennis: "/tennis-coach" },
  es: { padel: "/es/profesor-de-padel", tennis: "/es/profesor-de-tenis" },
};

const CitySportLanding = ({ locale, sport }: Props) => {
  const { city: citySlug } = useParams();
  const city = citySlug ? findCity(citySlug) : null;
  const [coaches, setCoaches] = useState<Array<{
    user_id: string;
    profile_slug: string | null;
    location_city: string | null;
    hourly_rate_from: number | null;
    languages: string[] | null;
    is_verified: boolean;
  }>>([]);

  const copy = getCopy(locale, sport);
  const altPath = (l: Locale) => `${PATH_PREFIX[l][sport]}/${citySlug}`;

  useEffect(() => {
    if (!city) return;
    const title = `${copy.h1(city.name)} | ACE Coach`;
    const description = copy.lead(city.name).slice(0, 158);

    // hreflang alternates
    document.head.querySelectorAll('link[rel="alternate"][data-seo="hreflang"]').forEach((n) => n.remove());
    (["en", "es"] as Locale[]).forEach((l) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = l;
      link.href = `${SITE.url}${altPath(l)}`;
      link.setAttribute("data-seo", "hreflang");
      document.head.appendChild(link);
    });
    const xDefault = document.createElement("link");
    xDefault.rel = "alternate";
    xDefault.hreflang = "x-default";
    xDefault.href = `${SITE.url}${altPath("en")}`;
    xDefault.setAttribute("data-seo", "hreflang");
    document.head.appendChild(xDefault);

    setSeo({
      title,
      description,
      path: altPath(locale),
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: sport === "padel" ? "Padel Coaching" : "Tennis Coaching",
          provider: { "@type": "Organization", name: "ACE Coach", url: SITE.url },
          areaServed: {
            "@type": "City",
            name: city.name,
            address: { "@type": "PostalAddress", addressLocality: city.name, addressCountry: city.countryCode },
            geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lng },
          },
          offers: { "@type": "AggregateOffer", priceCurrency: "EUR", lowPrice: sport === "padel" ? 15 : 30, highPrice: sport === "padel" ? 80 : 100 },
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: copy.faq(city.name).map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
            { "@type": "ListItem", position: 2, name: sport === "padel" ? "Padel" : "Tennis", item: `${SITE.url}${PATH_PREFIX[locale][sport]}` },
            { "@type": "ListItem", position: 3, name: city.name, item: `${SITE.url}${altPath(locale)}` },
          ],
        },
      ],
    });

    return () => {
      document.head.querySelectorAll('link[rel="alternate"][data-seo="hreflang"]').forEach((n) => n.remove());
    };
  }, [city, locale, sport]);

  // Pull a few real coaches that match the sport + city (best-effort)
  useEffect(() => {
    if (!city) return;
    (async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("user_id, profile_slug, location_city, hourly_rate_from, languages, is_verified, primary_sport")
        .ilike("location_city", `%${city.name}%`)
        .eq("primary_sport", sport)
        .limit(6);
      setCoaches((data as any[]) || []);
    })();
  }, [city, sport]);

  const otherCities = useMemo(() => CITIES.filter((c) => c.slug !== citySlug).slice(0, 12), [citySlug]);

  if (!city) return <Navigate to="/" replace />;

  const T = locale === "es"
    ? { other: "Otras ciudades", switchSport: sport === "padel" ? "Tenis" : "Pádel", language: "Español", switchLang: "English", verified: "Verificado", from: "Desde", featured: "Profesores destacados", noCoaches: "Sé el primero en enseñar aquí.", explore: "Ver todos los profesores" }
    : { other: "Other cities", switchSport: sport === "padel" ? "Tennis" : "Padel", language: "English", switchLang: "Español", verified: "Verified", from: "From", featured: "Featured coaches", noCoaches: "Be the first coach here.", explore: "Browse all coaches" };

  const otherSport: Sport = sport === "padel" ? "tennis" : "padel";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Link to="/" className="font-body text-xs text-muted-foreground hover:text-foreground">Home</Link>
            <span className="text-muted-foreground">/</span>
            <Link to={PATH_PREFIX[locale][sport]} className="font-body text-xs text-muted-foreground hover:text-foreground capitalize">
              {sport === "padel" ? (locale === "es" ? "Pádel" : "Padel") : locale === "es" ? "Tenis" : "Tennis"}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-body text-xs text-foreground">{city.name}</span>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-body text-xs tracking-wider mb-4">
            <MapPin size={14} /> {city.name.toUpperCase()}, {city.country.toUpperCase()}
          </span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-6xl leading-tight mb-4"
          >
            {copy.h1(city.name)}
          </motion.h1>
          <p className="font-body text-base md:text-lg text-muted-foreground max-w-2xl mb-8">
            {copy.lead(city.name)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/find-a-coach?city=${encodeURIComponent(city.name)}&sport=${sport}`}
              className="inline-flex items-center gap-2 font-display text-sm tracking-widest bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              {copy.cta1} <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-display text-sm tracking-widest border border-border text-foreground px-6 py-3 rounded-xl hover:bg-card transition-colors"
            >
              {copy.cta2}
            </Link>
            <Link
              to={`${PATH_PREFIX[locale][otherSport]}/${city.slug}`}
              className="inline-flex items-center gap-2 font-display text-xs tracking-widest text-muted-foreground px-4 py-3 hover:text-foreground"
            >
              {T.switchSport} →
            </Link>
            <Link
              to={altPath(locale === "en" ? "es" : "en")}
              className="inline-flex items-center gap-2 font-display text-xs tracking-widest text-muted-foreground px-4 py-3 hover:text-foreground"
            >
              <Globe size={14} /> {T.switchLang}
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
          {[
            { icon: Star, title: copy.benefit1Title, desc: copy.benefit1(city.name) },
            { icon: Calendar, title: copy.benefit2Title, desc: copy.benefit2 },
            { icon: Trophy, title: copy.benefit3Title, desc: copy.benefit3 },
          ].map((b, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <b.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-display text-lg tracking-wider mb-2">{b.title}</h3>
              <p className="font-body text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured coaches */}
      <section className="py-12 px-6 border-y border-border bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl mb-6">{T.featured}</h2>
          {coaches.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-body text-muted-foreground mb-4">{T.noCoaches}</p>
              <Link to="/login" className="inline-flex items-center gap-2 font-display text-sm tracking-widest bg-primary text-primary-foreground px-5 py-2.5 rounded-lg">
                {copy.cta2} <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coaches.map((c) => (
                <Link
                  key={c.user_id}
                  to={c.profile_slug ? `/coach/${c.profile_slug}` : "/find-a-coach"}
                  className="block bg-background border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-display text-sm tracking-wider">{c.profile_slug || "Coach"}</span>
                    {c.is_verified && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{T.verified}</span>}
                  </div>
                  <p className="font-body text-xs text-muted-foreground mb-1">{c.location_city}</p>
                  {c.hourly_rate_from != null && (
                    <p className="font-body text-sm">{T.from} <span className="font-display text-primary">€{c.hourly_rate_from}</span> / h</p>
                  )}
                </Link>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Link
              to={`/find-a-coach?city=${encodeURIComponent(city.name)}&sport=${sport}`}
              className="inline-flex items-center gap-2 font-body text-sm text-primary hover:underline"
            >
              {T.explore} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl mb-6">FAQ</h2>
          <div className="space-y-4">
            {copy.faq(city.name).map((f, i) => (
              <details key={i} className="group bg-card border border-border rounded-xl p-5">
                <summary className="font-display text-base cursor-pointer list-none flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-primary group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="font-body text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Other cities */}
      <section className="py-12 px-6 border-t border-border bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-xl tracking-wider mb-4">{T.other}</h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                to={`${PATH_PREFIX[locale][sport]}/${c.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-full font-body text-xs hover:border-primary/50"
              >
                <Search size={12} /> {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicBottomNav />
    </div>
  );
};

export default CitySportLanding;
