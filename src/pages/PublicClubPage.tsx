import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Mail, Phone, Users, Calendar, Square } from "lucide-react";
import { format } from "date-fns";
import FollowClubButton from "@/components/FollowClubButton";
import PublicHeader from "@/components/PublicHeader";
import PublicBottomNav from "@/components/PublicBottomNav";

interface Club {
  id: string; name: string; slug: string | null; description: string | null;
  city: string | null; country: string | null; address: string | null;
  contact_email: string | null; contact_phone: string | null;
  logo_url: string | null;
}
interface Coach { user_id: string; full_name: string; avatar_url: string | null; profile_slug: string | null; hourly_rate_from: number | null; bio: string | null; }
interface ClubEvent { id: string; title: string; start_datetime: string; cover_image_url: string | null; sport: string; }

const PublicClubPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [followers, setFollowers] = useState(0);
  const [courts, setCourts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: clubData } = await supabase
        .from("clubs")
        .select("id, name, slug, description, city, country, address, contact_email, contact_phone, logo_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (!clubData) { setNotFound(true); setLoading(false); return; }
      setClub(clubData as Club);

      // SEO: title + meta + JSON-LD
      document.title = `${clubData.name} – Club Profile`;
      const setMeta = (name: string, content: string) => {
        let el = document.querySelector(`meta[name="${name}"]`);
        if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
        el.setAttribute("content", content);
      };
      setMeta("description", clubData.description?.slice(0, 155) || `${clubData.name} – racket sports club in ${clubData.city || ""}.`);

      const [coachesRes, eventsRes, followersRes, courtsRes] = await Promise.all([
        supabase.from("club_coaches").select("coach_id").eq("club_id", clubData.id),
        supabase.from("events").select("id, title, start_datetime, cover_image_url, sport").eq("club_id", clubData.id).eq("status", "published").gte("start_datetime", new Date().toISOString()).order("start_datetime").limit(6),
        supabase.from("club_followers").select("id", { count: "exact", head: true }).eq("club_id", clubData.id),
        supabase.from("club_courts").select("id", { count: "exact", head: true }).eq("club_id", clubData.id).eq("is_active", true),
      ]);

      const coachIds = (coachesRes.data || []).map((c: any) => c.coach_id);
      if (coachIds.length > 0) {
        const [profsRes, cpRes] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", coachIds),
          supabase.from("coach_profiles").select("user_id, profile_slug, hourly_rate_from, bio").in("user_id", coachIds),
        ]);
        const list = coachIds.map((id: string) => {
          const p = (profsRes.data || []).find((x: any) => x.user_id === id);
          const cp = (cpRes.data || []).find((x: any) => x.user_id === id);
          return {
            user_id: id,
            full_name: p?.full_name || "Coach",
            avatar_url: p?.avatar_url || null,
            profile_slug: cp?.profile_slug || null,
            hourly_rate_from: cp?.hourly_rate_from || null,
            bio: cp?.bio || null,
          };
        });
        setCoaches(list);
      }
      setEvents((eventsRes.data || []) as ClubEvent[]);
      setFollowers(followersRes.count || 0);
      setCourts(courtsRes.count || 0);
      setLoading(false);
    })();
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="font-display text-2xl text-foreground">Club not found</h1>
          <Link to="/" className="text-primary text-sm">← Back home</Link>
        </div>
      </div>
    );
  }

  if (loading || !club) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const location = [club.city, club.country].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {club.logo_url ? (
              <img src={club.logo_url} alt={`${club.name} logo`} className="w-24 h-24 rounded-2xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center font-display text-3xl text-primary">
                {club.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl md:text-4xl tracking-wide text-foreground uppercase">{club.name}</h1>
              {location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                  <MapPin size={14} /> {location}
                </div>
              )}
              {club.description && (
                <p className="text-sm font-body text-muted-foreground mt-3 max-w-2xl">{club.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Users size={14} className="text-primary" /> {coaches.length} coaches</div>
                <div className="flex items-center gap-1.5"><Square size={14} className="text-accent" /> {courts} courts</div>
                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-foreground" /> {events.length} upcoming events</div>
                <div className="flex items-center gap-1.5">❤ {followers} followers</div>
              </div>
            </div>
            <div className="md:ml-auto">
              <FollowClubButton clubId={club.id} />
            </div>
          </div>
        </div>
      </section>

      {/* Coaches */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-4">Our Coaches</h2>
        {coaches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coaches listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((c) => (
              <Link
                key={c.user_id}
                to={c.profile_slug ? `/coach/${c.profile_slug}` : "#"}
                className="block p-5 rounded-xl border border-border hover:border-primary transition-colors bg-card"
              >
                <div className="flex items-center gap-3">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.full_name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display">
                      {c.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-body text-sm text-foreground truncate">{c.full_name}</div>
                    {c.hourly_rate_from && (
                      <div className="text-xs text-muted-foreground">From €{c.hourly_rate_from}/h</div>
                    )}
                  </div>
                </div>
                {c.bio && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{c.bio}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Events */}
      {events.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 border-t border-border">
          <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <Link key={e.id} to="/events" className="block rounded-xl border border-border hover:border-primary overflow-hidden bg-card transition-colors">
                {e.cover_image_url && <img src={e.cover_image_url} alt={e.title} className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{format(new Date(e.start_datetime), "MMM d · HH:mm")}</div>
                  <div className="font-body text-sm text-foreground mt-1 line-clamp-2">{e.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      {(club.contact_email || club.contact_phone || club.address) && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 py-10 border-t border-border">
          <h2 className="font-display text-sm uppercase tracking-wider text-foreground mb-4">Contact</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            {club.address && <div className="flex items-center gap-2"><MapPin size={14} /> {club.address}</div>}
            {club.contact_email && <a href={`mailto:${club.contact_email}`} className="flex items-center gap-2 hover:text-primary"><Mail size={14} /> {club.contact_email}</a>}
            {club.contact_phone && <a href={`tel:${club.contact_phone}`} className="flex items-center gap-2 hover:text-primary"><Phone size={14} /> {club.contact_phone}</a>}
          </div>
        </section>
      )}

      <PublicBottomNav />
    </div>
  );
};

export default PublicClubPage;
