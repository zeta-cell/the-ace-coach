import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { useClub } from "@/hooks/useClub";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  court_number: string | null;
  coach_id: string;
  player_id: string;
  coach_name?: string;
  player_name?: string;
}

const ClubBookings = () => {
  const { activeClub, activeClubId } = useClub();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClubId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select("id, booking_date, start_time, end_time, status, total_price, court_number, coach_id, player_id")
        .eq("club_id", activeClubId)
        .gte("booking_date", new Date().toISOString().split("T")[0])
        .order("booking_date")
        .order("start_time");

      const ids = Array.from(new Set([...(data || []).map((b) => b.coach_id), ...(data || []).map((b) => b.player_id)]));
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ids) : { data: [] };

      const enriched = (data || []).map((b) => ({
        ...b,
        coach_name: profiles?.find((p: any) => p.user_id === b.coach_id)?.full_name,
        player_name: profiles?.find((p: any) => p.user_id === b.player_id)?.full_name,
      }));
      setBookings(enriched as Booking[]);
      setLoading(false);
    })();
  }, [activeClubId]);

  if (!activeClub) return <PortalLayout><div className="p-6">No club found.</div></PortalLayout>;

  // Group by date
  const grouped = bookings.reduce((acc: Record<string, Booking[]>, b) => {
    if (!acc[b.booking_date]) acc[b.booking_date] = [];
    acc[b.booking_date].push(b);
    return acc;
  }, {});

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">Club Bookings</h1>
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mt-1">Across all coaches</p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : Object.keys(grouped).length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarIcon size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-body text-muted-foreground">No upcoming bookings.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, list]) => (
              <div key={date}>
                <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  {format(new Date(date), "EEEE, MMM d")}
                </h2>
                <div className="space-y-2">
                  {list.map((b) => (
                    <Card key={b.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <Clock size={14} className="mx-auto text-primary mb-1" />
                          <div className="text-sm font-display text-foreground">{b.start_time.slice(0, 5)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-body text-foreground">
                            {b.player_name} <span className="text-muted-foreground">with</span> {b.coach_name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {b.court_number && <span className="flex items-center gap-1"><MapPin size={10} /> Court {b.court_number}</span>}
                            <span>€{b.total_price}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default ClubBookings;
