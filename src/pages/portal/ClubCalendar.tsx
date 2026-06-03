import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PortalLayout from "@/components/portal/PortalLayout";
import { useClub } from "@/hooks/useClub";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, UserCheck, Users } from "lucide-react";
import { format } from "date-fns";

interface ClubBooking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  court_number: string | null;
  coach_id: string;
  player_id: string;
  coach_name?: string;
  player_name?: string;
}

const ClubCalendar = () => {
  const { activeClub, activeClubId } = useClub();
  const [bookings, setBookings] = useState<ClubBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeClubId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bookings")
        .select("id, booking_date, start_time, end_time, status, court_number, coach_id, player_id")
        .eq("club_id", activeClubId)
        .gte("booking_date", new Date().toISOString().split("T")[0])
        .order("booking_date")
        .order("start_time");

      const ids = Array.from(new Set([...(data || []).map((b) => b.coach_id), ...(data || []).map((b) => b.player_id)]));
      const { data: profiles } = ids.length ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ids) : { data: [] };
      setBookings(((data || []) as ClubBooking[]).map((b) => ({
        ...b,
        coach_name: profiles?.find((p: any) => p.user_id === b.coach_id)?.full_name,
        player_name: profiles?.find((p: any) => p.user_id === b.player_id)?.full_name,
      })));
      setLoading(false);
    })();
  }, [activeClubId]);

  if (!activeClub) return <PortalLayout><div className="p-6">No club found.</div></PortalLayout>;

  const grouped = bookings.reduce((acc: Record<string, ClubBooking[]>, b) => {
    if (!acc[b.booking_date]) acc[b.booking_date] = [];
    acc[b.booking_date].push(b);
    return acc;
  }, {});

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground uppercase">Coach Calendar</h1>
          <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mt-1">All coaches, members, courts and bookings</p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : Object.keys(grouped).length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarDays size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-body text-muted-foreground">No upcoming coach bookings.</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, list]) => (
              <Card key={date} className="p-5">
                <h2 className="font-display text-xs uppercase tracking-wider text-muted-foreground mb-3">{format(new Date(date), "EEEE, MMM d")}</h2>
                <div className="space-y-3">
                  {list.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Clock size={16} className="text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-body text-foreground">{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><UserCheck size={12} /> {b.coach_name || "Coach"}</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {b.player_name || "Member"}</span>
                            {b.court_number && <span className="flex items-center gap-1"><MapPin size={12} /> Court {b.court_number}</span>}
                          </div>
                        </div>
                      </div>
                      <Badge variant={b.status === "confirmed" ? "default" : "secondary"} className="shrink-0">{b.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default ClubCalendar;