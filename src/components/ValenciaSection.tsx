import { motion } from "framer-motion";
import { MapPin, Utensils, Camera, Bike, Sun, Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import valenciaAerial from "@/assets/valencia-aerial.jpg";

const hotspotIcons = [Utensils, Camera, Bike];

const ValenciaSection = () => {
  const { t } = useLanguage();
  const v = t.valenciaSection;

  return (
    <section className="py-24 bg-cream-dark">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <p className="font-body text-primary text-sm font-semibold tracking-[0.3em] uppercase mb-4">{v.subtitle}</p>
          <h2 className="font-display text-5xl md:text-7xl text-foreground">
            {v.title} <span className="text-gradient">{v.titleGradient}</span> {v.titleEnd}
          </h2>
          <p className="font-body text-muted-foreground mt-4 max-w-3xl mx-auto leading-relaxed">{v.desc}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative rounded-2xl overflow-hidden">
            <img src={valenciaAerial} alt="Aerial view of Valencia, Spain" className="w-full h-[450px] object-cover rounded-2xl" />
            <div className="absolute inset-0 bg-overlay-dark rounded-2xl" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4">
                <div className="bg-hero-gradient rounded-full w-14 h-14 flex items-center justify-center">
                  <Sun className="text-primary-foreground" size={24} />
                </div>
                <div>
                  <p className="font-display text-xl text-foreground">{v.sunDays}</p>
                  <p className="font-body text-sm text-muted-foreground">{v.sunDesc}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="font-display text-3xl md:text-4xl text-foreground mb-6">{v.whyValencia}</h3>
            <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
              <p>{v.whyP1}</p>
              <p>{v.whyP2}</p>
              <p><strong className="text-foreground">{v.whyP3}</strong></p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <h3 className="font-display text-3xl md:text-4xl text-foreground text-center mb-10">
            {v.trainingLocations} <span className="text-gradient">{v.trainingLocationsGradient}</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {v.locations.map((loc, i) => (
              <motion.div key={loc.name} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="text-primary" size={20} />
                </div>
                <h4 className="font-display text-xl text-foreground mb-2">{loc.name}</h4>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">{loc.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <div className="rounded-2xl overflow-hidden border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d99185.13726649852!2d-0.4378343!3d39.4699075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd604f4cf0efb06f%3A0xb4a351012d4b503!2sValencia%2C%20Spain!5e0!3m2!1sen!2ses!4v1700000000000!5m2!1sen!2ses"
              width="100%" height="400" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Valencia, Spain map" className="w-full"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h3 className="font-display text-3xl md:text-4xl text-foreground text-center mb-4">
            {v.beyondCourt} <span className="text-gradient">{v.beyondCourtGradient}</span>
          </h3>
          <p className="font-body text-muted-foreground text-center max-w-2xl mx-auto mb-10 leading-relaxed">{v.beyondCourtDesc}</p>
          <div className="grid md:grid-cols-3 gap-8">
            {v.hotspots.map((spot, i) => {
              const Icon = hotspotIcons[i];
              return (
                <motion.div key={spot.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-2xl p-8 hover:border-primary/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h4 className="font-display text-2xl text-foreground mb-4">{spot.title}</h4>
                  <ul className="space-y-3">
                    {spot.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Star className="text-primary flex-shrink-0 mt-0.5" size={14} />
                        <span className="font-body text-muted-foreground text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ValenciaSection;