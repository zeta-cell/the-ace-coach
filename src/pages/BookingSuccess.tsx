import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Check, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface BookingInfo {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  currency: string;
  coach_name: string;
  package_title: string;
}

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_date, start_time, end_time, total_price, currency, coach_id, package_id")
      .eq("id", bookingId!)
      .single();

    if (data) {
      const [coachRes, pkgRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", data.coach_id).single(),
        data.package_id
          ? supabase.from("coach_packages").select("title").eq("id", data.package_id).single()
          : { data: null },
      ]);

      setBooking({
        ...data,
        coach_name: coachRes.data?.full_name || "Coach",
        package_title: pkgRes.data?.title || "Session",
      });
    }
    setLoading(false);
  };

  const currencySymbol = (c: string) => c === "EUR" ? "€" : c === "USD" ? "$" : c === "GBP" ? "£" : c;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.4 }}
          >
            <Check size={40} className="text-green-400" />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h1 className="font-display text-3xl text-foreground">BOOKING CONFIRMED!</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">Your session has been booked successfully.</p>
        </motion.div>

        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card border border-border rounded-xl p-5 text-left space-y-2"
          >
            <div className="flex justify-between text-sm font-body">
              <span className="text-muted-foreground">Coach</span>
              <span className="text-foreground font-medium">{booking.coach_name}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-muted-foreground">Package</span>
              <span className="text-foreground">{booking.package_title}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">{format(new Date(booking.booking_date + "T00:00:00"), "EEE, d MMM yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-muted-foreground">Time</span>
              <span className="text-foreground">{booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <span className="font-body text-sm text-muted-foreground">Paid</span>
              <span className="font-display text-xl text-foreground">{currencySymbol(booking.currency)}{Number(booking.total_price).toFixed(2)}</span>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-3"
        >
          <Link
            to="/dashboard"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            VIEW MY SESSIONS <ArrowRight size={16} />
          </Link>
          <Link
            to="/find-a-coach"
            className="w-full py-3 rounded-xl bg-card border border-border text-foreground font-display tracking-wider hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            FIND MORE COACHES <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingSuccess;
