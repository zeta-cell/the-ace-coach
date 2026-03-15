import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { toast } from "sonner";

interface BookingItem {
  id: string;
  type: "booking" | "event";
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  currency: string;
  coach_name: string;
  coach_avatar: string | null;
  package_title: string;
  session_type: string;
  event_id?: string;
}

const UpcomingBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch bookings
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_date, start_time, end_time, status, total_price, currency, coach_id, package_id")
      .eq("player_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("booking_date", today)
      .order("booking_date")
      .limit(5);

    let bookingItems: BookingItem[] = [];

    if (data && data.length > 0) {
      const coachIds = [...new Set(data.map(b => b.coach_id))];
      const pkgIds = [...new Set(data.filter(b => b.package_id).map(b => b.package_id!))];

      const [profilesRes, pkgsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", coachIds),
        pkgIds.length > 0 ? supabase.from("coach_packages").select("id, title, session_type").in("id", pkgIds) : { data: [] },
      ]);

      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      const pkgMap = new Map((pkgsRes.data || []).map(p => [p.id, p]));

      bookingItems = data.map(b => {
        const coach = profileMap.get(b.coach_id);
        const pkg = pkgMap.get(b.package_id);
        return {
          id: b.id,
          type: "booking" as const,
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status,
          total_price: b.total_price,
          currency: b.currency,
          coach_name: coach?.full_name || "Coach",
          coach_avatar: coach?.avatar_url || null,
          package_title: pkg?.title || "Session",
          session_type: pkg?.session_type || "individual",
        };
      });
    }

    // Fetch event registrations
    const { data: eventRegs } = await supabase
      .from("event_registrations")
      .select("id, event_id, status, amount_paid")
      .eq("player_id", user.id)
      .eq("status", "registered");

    if (eventRegs && eventRegs.length > 0) {
      const eventIds = eventRegs.map(r => r.event_id);
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, start_datetime, end_datetime, location_city, coach_id, price_per_person, currency")
        .in("id", eventIds)
        .gte("start_datetime", new Date(today).toISOString())
        .order("start_datetime");

      if (eventsData && eventsData.length > 0) {
        const coachIds = [...new Set(eventsData.map(e => e.coach_id))];
        const { data: coachProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", coachIds);
        const coachMap = new Map((coachProfiles || []).map(p => [p.user_id, p]));

        const eventItems: BookingItem[] = eventsData.map(e => {
          const coach = coachMap.get(e.coach_id);
          const reg = eventRegs.find(r => r.event_id === e.id);
          return {
            id: reg?.id || e.id,
            type: "event" as const,
            coach_name: coach?.full_name || "Coach",
            coach_avatar: coach?.avatar_url || null,
            booking_date: e.start_datetime.split("T")[0],
            start_time: e.start_datetime.split("T")[1]?.substring(0, 8) || "00:00:00",
            end_time: e.end_datetime.split("T")[1]?.substring(0, 8) || "00:00:00",
            package_title: e.title,
            session_type: "event",
            status: "confirmed",
            total_price: Number(e.price_per_person) || 0,
            currency: e.currency || "EUR",
            event_id: e.id,
          };
        });

        bookingItems = [...bookingItems, ...eventItems].sort((a, b) =>
          a.booking_date.localeCompare(b.booking_date)
        );
      }
    }

    setBookings(bookingItems);
  };

  const cancelItem = async (b: BookingItem) => {
    if (!user) return;
    if (b.type === "event") {
      await supabase.from("event_registrations").update({ status: "cancelled" }).eq("id", b.id);
      toast.success("Registration cancelled");
    } else {
      await supabase.from("bookings").update({
        status: "cancelled",
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
      }).eq("id", b.id);
      toast.success("Session cancelled");
    }
    setBookings(prev => prev.filter(item => item.id !== b.id));
  };

  const currencySymbol = (c: string) => c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : c;

  if (bookings.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3 mb-6">
        <p className="font-display text-sm tracking-wider text-muted-foreground">UPCOMING SESSIONS</p>
        <p className="font-body text-sm text-muted-foreground">No upcoming sessions booked yet.</p>
        <Link
          to="/find-a-coach"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider hover:bg-primary/90 transition-colors"
        >
          FIND A COACH →
        </Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm tracking-wider text-foreground flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> UPCOMING SESSIONS
        </h3>
      </div>
      <div className="space-y-2">
        {bookings.map(b => {
          const sessionDateTime = new Date(`${b.booking_date}T${b.start_time}`);
          const canCancel = differenceInHours(sessionDateTime, new Date()) > 24;

          return (
            <div key={b.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center shrink-0">
                  {b.coach_avatar ? (
                    <img src={b.coach_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-sm text-primary">{b.coach_name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-foreground">{b.coach_name}</p>
                  <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                    <span>{format(new Date(b.booking_date + "T00:00:00"), "EEE, d MMM")}</span>
                    <span>·</span>
                    <span>{b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {b.type === "event" ? (
                      <span className="text-[9px] font-display font-semibold bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        EVENT
                      </span>
                    ) : (
                      <span className="text-[9px] font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">
                        {b.package_title}
                      </span>
                    )}
                    <span className={`text-[9px] font-body font-semibold px-2 py-0.5 rounded-full uppercase ${b.status === "confirmed" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                      {b.status === "confirmed" ? "CONFIRMED" : "PENDING PAYMENT"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-foreground">{currencySymbol(b.currency)}{Number(b.total_price).toFixed(0)}</p>
                  {canCancel && (
                    <button
                      onClick={() => cancelItem(b)}
                      className="mt-1 text-[9px] font-display text-destructive hover:underline flex items-center gap-0.5 ml-auto"
                    >
                      <X size={10} /> {b.type === "event" ? "CANCEL REG" : "CANCEL"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default UpcomingBookings;
