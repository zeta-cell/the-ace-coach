-- Trigger: when a booking transitions to 'completed', create a review-prompt notification for the player
CREATE OR REPLACE FUNCTION public.notify_review_prompt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coach_name text;
  v_already_reviewed boolean;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.reviews
      WHERE coach_id = NEW.coach_id AND player_id = NEW.player_id
    ) INTO v_already_reviewed;

    IF NOT v_already_reviewed THEN
      SELECT full_name INTO v_coach_name FROM public.profiles WHERE user_id = NEW.coach_id;
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (
        NEW.player_id,
        'How was your session?',
        'Leave a review for ' || COALESCE(v_coach_name, 'your coach') || ' to help other players.',
        '/coach/' || COALESCE(
          (SELECT profile_slug FROM public.coach_profiles WHERE user_id = NEW.coach_id),
          NEW.coach_id::text
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_review_prompt ON public.bookings;
CREATE TRIGGER trg_notify_review_prompt
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_review_prompt();