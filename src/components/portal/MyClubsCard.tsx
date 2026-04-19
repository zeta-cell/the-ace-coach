import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, MapPin, Plus } from "lucide-react";

interface FollowedClub {
  id: string;
  name: string;
  city: string | null;
  logo_url: string | null;
  slug: string | null;
}

const MyClubsCard = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<FollowedClub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: follows } = await supabase
      .from("club_followers")
      .select("club_id")
      .eq("user_id", user.id);
    const ids = (follows || []).map((f) => f.club_id);
    if (ids.length === 0) {
      setClubs([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("clubs")
      .select("id, name, city, logo_url, slug")
      .in("id", ids)
      .eq("is_active", true);
    setClubs(data || []);
    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
          <Building2 size={14} className="text-primary" /> MY CLUBS
        </h3>
        <Link to="/find-a-coach" className="text-xs font-display text-primary tracking-wider hover:underline">
          DISCOVER →
        </Link>
      </div>
      {clubs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="font-body text-sm text-muted-foreground mb-3">
            Follow a club to get notified about new events and bookings.
          </p>
          <Link
            to="/find-a-coach"
            className="inline-flex items-center gap-1.5 text-xs font-display tracking-wider text-primary hover:underline"
          >
            <Plus size={12} /> FIND A CLUB
          </Link>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {clubs.map((c) => (
            <Link
              key={c.id}
              to="/events"
              className="shrink-0 w-36 bg-card border border-border rounded-xl p-3 text-center hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg mx-auto mb-1.5 overflow-hidden bg-secondary flex items-center justify-center">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={18} className="text-primary" />
                )}
              </div>
              <p className="font-display text-xs text-foreground truncate">{c.name}</p>
              {c.city && (
                <p className="font-body text-[9px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
                  <MapPin size={8} /> {c.city}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClubsCard;
