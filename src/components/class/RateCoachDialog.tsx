import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Star, X, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  coachId: string;
  coachName: string;
  eventId?: string;
}

const RateCoachDialog = ({ open, onClose, coachId, coachName }: Props) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("reviews")
      .select("id, rating, comment")
      .eq("coach_id", coachId)
      .eq("player_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setRating(data.rating);
          setComment(data.comment || "");
        }
      });
  }, [open, user, coachId]);

  const submit = async () => {
    if (!user) return;
    if (rating < 1) {
      toast.error("Pick a star rating first");
      return;
    }
    setSaving(true);
    const payload = { coach_id: coachId, player_id: user.id, rating, comment: comment.trim() || null };
    const { error } = existingId
      ? await supabase.from("reviews").update(payload).eq("id", existingId)
      : await supabase.from("reviews").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(existingId ? "Review updated" : "Thanks for your review!");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-t-3xl border border-border bg-card p-5 md:rounded-3xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-base tracking-wider text-foreground">RATE {coachName.toUpperCase()}</h2>
            <p className="font-body text-xs text-muted-foreground">Your rating helps other players choose.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center gap-1.5 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                size={30}
                className={(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="What stood out? Drills, energy, feedback quality…"
          className="w-full rounded-xl border border-border bg-secondary px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <button
          onClick={submit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-[11px] tracking-wider text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
          {existingId ? "UPDATE REVIEW" : "SUBMIT REVIEW"}
        </button>
      </div>
    </div>
  );
};

export default RateCoachDialog;
