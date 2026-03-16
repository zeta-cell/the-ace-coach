import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Ticket, ChevronDown, ChevronUp, Gift, Target, Users, Video, Star } from "lucide-react";

const RaffleCard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_stats").select("raffle_tickets").eq("user_id", user.id).maybeSingle();
    setTickets(data?.raffle_tickets || 0);
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-card border border-primary/20 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm tracking-wider text-foreground flex items-center gap-2">
          <Ticket size={14} className="text-primary" /> MONTHLY RAFFLE
        </h3>
        <span className="font-body text-xs text-primary">{daysLeft} days left</span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="text-center">
          <p className="font-display text-3xl text-foreground">{tickets}</p>
          <p className="font-body text-[9px] text-muted-foreground uppercase tracking-wider">Your tickets</p>
        </div>
        <div className="flex-1 bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={14} className="text-primary" />
            <span className="font-display text-xs text-foreground">1ST PRIZE</span>
          </div>
          <p className="font-body text-xs text-muted-foreground">Free coaching session or €150 credit</p>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
      >
        How to earn more tickets {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-border space-y-1.5">
          <p className="font-body text-xs text-muted-foreground">🎯 Complete a training session → +1 ticket</p>
          <p className="font-body text-xs text-muted-foreground">👥 Refer a friend who signs up → +3 tickets</p>
          <p className="font-body text-xs text-muted-foreground">📹 Upload a progress video → +1 ticket</p>
          <p className="font-body text-xs text-muted-foreground">⭐ Write a coach review → +1 ticket</p>
        </div>
      )}
    </div>
  );
};

export default RaffleCard;
