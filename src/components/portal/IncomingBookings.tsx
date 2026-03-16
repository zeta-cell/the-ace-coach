import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Link2, Copy, MessageSquare } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";
import GroupFeedbackDrawer from "./GroupFeedbackDrawer";

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
  package_id: string | null;
  max_group_size: number | null;
}

interface GroupedBooking {
  key: string;
  package_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  package_title: string;
  session_type: string;
  max_group_size: number;
  currency: string;
  price_per_person: number;
  location_type: string | null;
  participants: { id: string; name: string; avatar: string | null; status: string }[];
  totalRevenue: number;
  totalPayout: number;
}

const IncomingBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekSummary, setWeekSummary] = useState({ count: 0, income: 0 });
  const [coachSlug, setCoachSlug] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchCoachSlug();
    }
  }, [user]);

  const fetchCoachSlug = async () => {
    if (!user) return;
    const { data } = await supabase.from("coach_profiles").select("profile_slug").eq("user_id", user.id).single();
    if (data) setCoachSlug(data.profile_slug);
  };

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
      .limit(20);

    if (!data || data.length === 0) return;

    const playerIds = [...new Set(data.map(b => b.player_id))];
    const pkgIds = [...new Set(data.filter(b => b.package_id).map(b => b.package_id!))];

    const [profilesRes, pkgsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", playerIds),
      pkgIds.length > 0 ? supabase.from("coach_packages").select("id, title, session_type, max_group_size").in("id", pkgIds) : { data: [] },
    ]);

    const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
    const pkgMap = new Map((pkgsRes.data as any[])?.map(p => [p.id, p]) || []);

    const mapped: Booking[] = data.map(b => {
      const player = profileMap.get(b.player_id);
      const pkg = pkgMap.get(b.package_id);
      return {
        ...b,
        player_name: player?.full_name || "Player",
        player_avatar: player?.avatar_url || null,
        package_title: pkg?.title || "Session",
        session_type: pkg?.session_type || "individual",
        max_group_size: pkg?.max_group_size || null,
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

  const handleCancelGroupBooking = async (bookingId: string, packageId: string, bookingDate: string) => {
    await supabase.from("bookings").update({ status: "cancelled", cancelled_by: user?.id, cancelled_at: new Date().toISOString() }).eq("id", bookingId);
    
    // Check waitlist
    const { data: waitlistEntry } = await supabase
      .from("booking_waitlist")
      .select("id, player_id")
      .eq("package_id", packageId)
      .eq("requested_date", bookingDate)
      .eq("status", "waiting")
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (waitlistEntry) {
      await supabase.from("booking_waitlist")
        .update({ status: "offered", notified_at: new Date().toISOString(), expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
        .eq("id", waitlistEntry.id);

      await supabase.from("notifications").insert({
        user_id: waitlistEntry.player_id,
        title: "A spot opened up!",
        body: `You have 24 hours to book your session on ${bookingDate}. Tap here to book now.`,
        link: coachSlug ? `/book/${coachSlug}?package=${packageId}&date=${bookingDate}` : "/find-a-coach",
      });
    }

    toast.success("Booking cancelled");
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const copyShareLink = (packageId: string, date: string) => {
    const link = `${window.location.origin}/book/${coachSlug}?package=${packageId}&date=${date}`;
    navigator.clipboard.writeText(link);
    toast.success("Booking link copied — share it on WhatsApp!");
  };

  const currencySymbol = (c: string) => c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : c;

  if (bookings.length === 0) return null;

  // Group bookings for group sessions
  const groupedBookings: GroupedBooking[] = [];
  const individualBookings: Booking[] = [];
  const groupMap = new Map<string, Booking[]>();

  bookings.forEach(b => {
    if (b.session_type === "group" && b.package_id && (b.max_group_size || 0) > 1) {
      const key = `${b.package_id}_${b.booking_date}`;
      const arr = groupMap.get(key) || [];
      arr.push(b);
      groupMap.set(key, arr);
    } else {
      individualBookings.push(b);
    }
  });

  groupMap.forEach((groupBookings, key) => {
    const first = groupBookings[0];
    groupedBookings.push({
      key,
      package_id: first.package_id!,
      booking_date: first.booking_date,
      start_time: first.start_time,
      end_time: first.end_time,
      package_title: first.package_title,
      session_type: first.session_type,
      max_group_size: first.max_group_size || 4,
      currency: first.currency,
      price_per_person: Number(first.total_price),
      location_type: first.location_type,
      participants: groupBookings.map(b => ({
        id: b.id, name: b.player_name, avatar: b.player_avatar, status: b.status,
      })),
      totalRevenue: groupBookings.reduce((s, b) => s + Number(b.total_price), 0),
      totalPayout: groupBookings.reduce((s, b) => s + Number(b.coach_payout), 0),
    });
  });

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
        {/* Group session cards */}
        {groupedBookings.map(g => {
          const emptySlots = g.max_group_size - g.participants.length;
          return (
            <div key={g.key} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-chart-2" />
                    <span className="font-display text-sm text-foreground">GROUP SESSION</span>
                    <span className="font-display text-xs text-muted-foreground">
                      — {format(new Date(g.booking_date + "T00:00:00"), "EEE d MMM")} {g.start_time.slice(0, 5)}
                    </span>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {g.package_title} (max {g.max_group_size})
                  </p>
                </div>
                {coachSlug && (
                  <button
                    onClick={() => copyShareLink(g.package_id, g.booking_date)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary font-display text-[9px] tracking-wider hover:bg-primary/20 transition-colors"
                  >
                    <Link2 size={10} /> SHARE LINK
                  </button>
                )}
              </div>

              <div className="space-y-1.5 mb-3">
                {g.participants.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center shrink-0">
                      {p.avatar ? (
                        <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-[9px] text-primary">{p.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="font-body text-xs text-foreground flex-1">{p.name}</span>
                    <span className={`text-[9px] font-display px-2 py-0.5 rounded-full uppercase ${
                      p.status === "confirmed" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                    }`}>{p.status}</span>
                  </div>
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full border border-dashed border-border flex items-center justify-center shrink-0">
                      <span className="text-muted-foreground text-[9px]">○</span>
                    </div>
                    <span className="font-body text-xs text-muted-foreground italic">open spot</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-body text-xs text-muted-foreground">
                  Revenue: {currencySymbol(g.currency)}{g.totalRevenue.toFixed(0)} ({g.participants.length} × {currencySymbol(g.currency)}{g.price_per_person.toFixed(0)})
                </span>
                <span className="font-body text-[9px] text-muted-foreground">
                  Your cut: {currencySymbol(g.currency)}{g.totalPayout.toFixed(0)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Individual booking cards */}
        {individualBookings.map(b => {
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
