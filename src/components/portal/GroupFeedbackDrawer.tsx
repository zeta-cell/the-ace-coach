import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  bookingId: string;
  name: string;
  avatar: string | null;
  playerId: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
  sessionTitle: string;
  sessionDate: string;
}

interface FeedbackEntry {
  rating: number;
  notes: string;
}

const GroupFeedbackDrawer = ({ open, onClose, participants, sessionTitle, sessionDate }: Props) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Record<string, FeedbackEntry>>(
    Object.fromEntries(participants.map(p => [p.bookingId, { rating: 3, notes: "" }]))
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const entries = participants.map(p => ({
      booking_id: p.bookingId,
      coach_id: user.id,
      player_id: p.playerId,
      rating: feedback[p.bookingId]?.rating || 3,
      notes: feedback[p.bookingId]?.notes?.trim() || null,
    }));

    const { error } = await supabase.from("booking_participant_feedback").insert(entries);

    if (error) {
      if (error.code === "23505") {
        toast.info("Feedback already submitted for this session");
      } else {
        toast.error("Failed to submit feedback");
      }
    } else {
      // Notify players
      await Promise.all(participants.map(p =>
        supabase.from("notifications").insert({
          user_id: p.playerId,
          title: "Coach feedback received",
          body: `Your coach left feedback for your ${sessionTitle} session on ${sessionDate}`,
          link: "/dashboard",
        })
      ));
      toast.success("Feedback submitted for all participants");
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-lg tracking-wider">
            SESSION FEEDBACK
          </SheetTitle>
          <p className="font-body text-xs text-muted-foreground">
            {sessionTitle} · {sessionDate}
          </p>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {participants.map(p => {
            const entry = feedback[p.bookingId] || { rating: 3, notes: "" };
            return (
              <div key={p.bookingId} className="bg-secondary/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center shrink-0">
                    {p.avatar ? (
                      <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-xs text-primary">{p.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-display text-sm text-foreground">{p.name}</span>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setFeedback(prev => ({
                        ...prev,
                        [p.bookingId]: { ...prev[p.bookingId], rating: star }
                      }))}
                      className="p-0.5"
                    >
                      <Star
                        size={20}
                        className={star <= entry.rating ? "text-chart-4 fill-chart-4" : "text-muted-foreground"}
                      />
                    </button>
                  ))}
                </div>

                {/* Notes */}
                <textarea
                  value={entry.notes}
                  onChange={(e) => setFeedback(prev => ({
                    ...prev,
                    [p.bookingId]: { ...prev[p.bookingId], notes: e.target.value }
                  }))}
                  placeholder="Notes for this player..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none"
                />
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-6 mb-4 py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "SUBMITTING..." : "SUBMIT FEEDBACK"}
        </button>
      </SheetContent>
    </Sheet>
  );
};

export default GroupFeedbackDrawer;
