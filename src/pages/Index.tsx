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

const features = [
  { icon: Search, title: "FIND YOUR COACH", desc: "Search by sport, location, language, availability & price. Tennis or Padel — your perfect match awaits." },
  { icon: Calendar, title: "BOOK INSTANTLY", desc: "See real-time availability, pick your slot, pay securely. Group sessions, 1-on-1, kids training — all in one place." },
  { icon: Trophy, title: "TRACK PROGRESS", desc: "Detailed dashboards with training stats, shot breakdowns, fitness metrics, and gamified rankings." },
  { icon: Users, title: "JOIN THE COMMUNITY", desc: "Events, group sessions, leaderboards, and a global network of players and coaches." },
  { icon: Shield, title: "VERIFIED COACHES", desc: "Certified pros with ratings, reviews, badges, and transparent pricing packages." },
  { icon: Zap, title: "AI-POWERED PLANS", desc: "Smart training modules for technique, fitness, mental game — tailored to your level." },
];

const stats = [
  { value: "500+", label: "COACHES" },
  { value: "10K+", label: "SESSIONS" },
  { value: "50+", label: "CITIES" },
  { value: "4.9★", label: "AVG RATING" },
];

const Index = () => {
  useEffect(() => {
    setSeo({
      title: "ACE Coach – Tennis & Padel Coaching, Booking & Training",
      description: "Find verified tennis & padel coaches, book sessions instantly, follow training programs and track your progress. Players, coaches and clubs in one platform.",
      path: "/",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "ACE Coach",
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        description: "Tennis and padel coaching platform: find coaches, book sessions, follow training plans, join events.",
      },
    });
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <PublicHeader />

      {/* Hero — full-bleed image */}
      <section className="relative min-h-[100vh] flex items-end">
        <img
          src={heroPadel}
          alt="Padel player mid-swing on clay court"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-16 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-body text-xs tracking-wider mb-6 shadow-lg">
              <MapPin size={14} /> TENNIS & PADEL COACHING PLATFORM
            </span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-6">
              FIND YOUR
              <br />
              <span className="text-primary">PERFECT COACH</span>
              <br />
              ANYWHERE
            </h1>
            <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
              The all-in-one platform for tennis & padel players to discover coaches,
              book sessions, track progress, and level up their game.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/find-a-coach"
                className="inline-flex items-center justify-center gap-2 font-display text-sm tracking-widest bg-primary text-primary-foreground px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
              >
                FIND A COACH <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 font-display text-sm tracking-widest bg-foreground/10 text-foreground px-8 py-3.5 rounded-xl hover:bg-foreground/20 transition-colors backdrop-blur-sm"
              >
                I'M A COACH
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-3xl md:text-4xl text-primary">{s.value}</p>
              <p className="font-body text-xs text-muted-foreground tracking-wider mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features — with background image */}
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
              EVERYTHING YOU <span className="text-primary">NEED</span>
            </h2>
            <p className="font-body text-muted-foreground max-w-xl mx-auto">
              No other platform bundles all these features for racket sports. We're building the future of coaching.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-card/70 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display text-lg tracking-wider mb-2">{f.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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
            HOW IT <span className="text-primary">WORKS</span>
          </motion.h2>

          <div className="space-y-0">
            {[
              { step: "01", title: "SEARCH", desc: "Enter your city, sport, and preferences. Filter by language, price, availability, and coaching style." },
              { step: "02", title: "BOOK", desc: "Pick a coach, choose a package or single session, select your time slot, and pay securely through the platform." },
              { step: "03", title: "TRAIN", desc: "Get personalized training plans, video analysis, progress tracking, and direct messaging with your coach." },
              { step: "04", title: "LEVEL UP", desc: "Track your improvement with stats, earn badges, climb the community rankings, and unlock new achievements." },
            ].map((item, i) => (
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
                  <h3 className="font-display text-xl tracking-wider mb-1">{item.title}</h3>
                  <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — full-bleed image */}
      <section className="relative py-32 px-6 overflow-hidden">
        <img
          src={ctaCourt}
          alt="Padel court at night with dramatic lighting"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-6xl mb-4">
              READY TO <span className="text-primary">ACE</span> IT?
            </h2>
            <p className="font-body text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of players and coaches on the most complete racket sports platform ever built.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-display text-sm tracking-widest bg-primary text-primary-foreground px-10 py-4 rounded-xl hover:bg-primary/90 transition-colors"
            >
              GET STARTED FREE <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SEO link cluster — internal links to programmatic landing pages */}
      <section className="border-t border-border py-14 px-6 bg-card/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl mb-2">FIND COACHES BY <span className="text-primary">CITY</span></h2>
          <p className="font-body text-sm text-muted-foreground mb-6">Padel and tennis coaches in your city — also available in Spanish.</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="font-display text-xs tracking-widest text-muted-foreground mb-3">PADEL</p>
              <div className="flex flex-wrap gap-2">
                {["madrid","barcelona","valencia","malaga","marbella","sevilla","palma","lisbon","milan","dubai"].map((c) => (
                  <Link key={c} to={`/padel-coach/${c}`} className="px-3 py-1.5 text-xs font-body border border-border rounded-full hover:border-primary/50 capitalize">
                    {c}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="font-display text-xs tracking-widest text-muted-foreground mb-3">TENNIS</p>
              <div className="flex flex-wrap gap-2">
                {["madrid","barcelona","paris","london","berlin","munich","milan","rome","miami","dubai"].map((c) => (
                  <Link key={c} to={`/tennis-coach/${c}`} className="px-3 py-1.5 text-xs font-body border border-border rounded-full hover:border-primary/50 capitalize">
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
          <span className="font-display text-lg tracking-wider">
            ACE<span className="text-primary"> Coach</span>
          </span>
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} ACE Coach. The future of racket sports coaching.
          </p>
        </div>
      </footer>
      <PublicBottomNav />
    </div>
  );
};

export default Index;
