import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Calendar, Clock, CreditCard, X } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { toast } from "sonner";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  currency: string;
  coach_name: string;
  coach_avatar: string | null;
  coach_verified: boolean;
  package_title: string;
  session_type: string;
}

const UpcomingBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_date, start_time, end_time, status, total_price, currency, coach_id, package_id")
      .eq("player_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("booking_date", today)
      .order("booking_date")
      .limit(5);

    if (!data || data.length === 0) return;

    const coachIds = [...new Set(data.map(b => b.coach_id))];
    const pkgIds = [...new Set(data.filter(b => b.package_id).map(b => b.package_id!))];

    const [profilesRes, pkgsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", coachIds),
      pkgIds.length > 0 ? supabase.from("coach_packages").select("id, title, session_type").in("id", pkgIds) : { data: [] },
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
    const pkgMap = new Map((pkgsRes.data as any[])?.map(p => [p.id, p]) || []);

    setBookings(data.map(b => {
      const coach = profileMap.get(b.coach_id);
      const pkg = pkgMap.get(b.package_id);
      return {
        ...b,
        coach_name: coach?.full_name || "Coach",
        coach_avatar: coach?.avatar_url || null,
        coach_verified: false,
        package_title: pkg?.title || "Session",
        session_type: pkg?.session_type || "individual",
      };
    }));
  };

  const cancelBooking = async (id: string) => {
    if (!user) return;
    await supabase.from("bookings").update({
      status: "cancelled",
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
    }).eq("id", id);
    toast.success("Session cancelled");
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const currencySymbol = (c: string) => c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : c;

  if (bookings.length === 0) return null;

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
                    <span className="text-[9px] font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">{b.package_title}</span>
                    <span className={`text-[9px] font-body font-semibold px-2 py-0.5 rounded-full uppercase ${b.status === "confirmed" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                      {b.status === "confirmed" ? "CONFIRMED" : "PENDING PAYMENT"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-foreground">{currencySymbol(b.currency)}{Number(b.total_price).toFixed(0)}</p>
                  {canCancel && (
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="mt-1 text-[9px] font-display text-destructive hover:underline flex items-center gap-0.5 ml-auto"
                    >
                      <X size={10} /> CANCEL
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
