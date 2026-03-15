import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  coach_payout: number;
  currency: string;
  player_name: string;
  player_avatar: string | null;
  package_title: string;
  session_type: string;
  location_type: string | null;
}

const IncomingBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekSummary, setWeekSummary] = useState({ count: 0, income: 0 });

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_date, start_time, end_time, status, total_price, coach_payout, currency, player_id, package_id, location_type")
      .eq("coach_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("booking_date", today)
      .order("booking_date")
      .limit(10);

    if (!data || data.length === 0) return;

    const playerIds = [...new Set(data.map(b => b.player_id))];
    const pkgIds = [...new Set(data.filter(b => b.package_id).map(b => b.package_id!))];

    const [profilesRes, pkgsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", playerIds),
      pkgIds.length > 0 ? supabase.from("coach_packages").select("id, title, session_type").in("id", pkgIds) : { data: [] },
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
    const pkgMap = new Map((pkgsRes.data as any[])?.map(p => [p.id, p]) || []);

    const mapped = data.map(b => {
      const player = profileMap.get(b.player_id);
      const pkg = pkgMap.get(b.package_id);
      return {
        ...b,
        player_name: player?.full_name || "Player",
        player_avatar: player?.avatar_url || null,
        package_title: pkg?.title || "Session",
        session_type: pkg?.session_type || "individual",
      };
    });

    setBookings(mapped);

    // Week summary
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    const we = endOfWeek(new Date(), { weekStartsOn: 1 });
    const wsStr = format(ws, "yyyy-MM-dd");
    const weStr = format(we, "yyyy-MM-dd");
    const thisWeek = mapped.filter(b => b.booking_date >= wsStr && b.booking_date <= weStr);
    setWeekSummary({
      count: thisWeek.length,
      income: thisWeek.reduce((s, b) => s + Number(b.coach_payout), 0),
    });
  };

  const markNoShow = async (id: string) => {
    await supabase.from("bookings").update({ status: "no_show" }).eq("id", id);
    toast.success("Marked as no-show");
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const markCompleted = async (id: string) => {
    await supabase.from("bookings").update({ status: "completed" }).eq("id", id);
    toast.success("Marked as completed");
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const currencySymbol = (c: string) => c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : c;

  if (bookings.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl text-foreground flex items-center gap-2">
          <Calendar size={20} className="text-primary" /> INCOMING BOOKINGS
        </h2>
        <span className="text-xs font-body text-muted-foreground">
          This week: {weekSummary.count} sessions · €{weekSummary.income.toFixed(0)} incoming
        </span>
      </div>
      <div className="space-y-2">
        {bookings.map(b => {
          const isPast = new Date(`${b.booking_date}T${b.end_time}`) < new Date();
          return (
            <div key={b.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center shrink-0">
                  {b.player_avatar ? (
                    <img src={b.player_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-sm text-primary">{b.player_name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-foreground">{b.player_name}</p>
                  <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                    <span>{format(new Date(b.booking_date + "T00:00:00"), "EEE, d MMM")}</span>
                    <span>·</span>
                    <span>{b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">{b.package_title}</span>
                    <span className={`text-[9px] font-body font-semibold px-2 py-0.5 rounded-full uppercase ${b.status === "confirmed" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                      {b.status.toUpperCase()}
                    </span>
                    {b.location_type && (
                      <span className="text-[9px] font-body text-muted-foreground flex items-center gap-0.5">
                        <MapPin size={8} /> {b.location_type === "in_person" ? "In Person" : "Online"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="font-display text-foreground">{currencySymbol(b.currency)}{Number(b.total_price).toFixed(0)}</p>
                  <p className="font-body text-[9px] text-muted-foreground">Your cut: {currencySymbol(b.currency)}{Number(b.coach_payout).toFixed(0)}</p>
                  {isPast && b.status === "confirmed" && (
                    <div className="flex gap-1">
                      <button onClick={() => markCompleted(b.id)} className="px-2 py-1 rounded text-[8px] font-display bg-green-500/10 text-green-400 hover:bg-green-500/20">DONE</button>
                      <button onClick={() => markNoShow(b.id)} className="px-2 py-1 rounded text-[8px] font-display bg-destructive/10 text-destructive hover:bg-destructive/20">NO-SHOW</button>
                    </div>
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

export default IncomingBookings;
