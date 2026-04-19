
-- ============================================================
-- 1. COURT CONFLICT PREVENTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_booking_court_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check if a court is assigned and status is active
  IF NEW.court_id IS NULL OR NEW.status NOT IN ('pending', 'confirmed') THEN
    RETURN NEW;
  END IF;

  -- Check overlap with other bookings on same court same date
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.court_id = NEW.court_id
      AND b.booking_date = NEW.booking_date
      AND b.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND b.status IN ('pending', 'confirmed')
      AND (NEW.start_time, NEW.end_time) OVERLAPS (b.start_time, b.end_time)
  ) THEN
    RAISE EXCEPTION 'Court is already booked for this time slot';
  END IF;

  -- Check overlap with events on same court
  IF EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.court_id = NEW.court_id
      AND e.status IN ('published', 'full')
      AND tstzrange(e.start_datetime, e.end_datetime, '[)') &&
          tstzrange(
            (NEW.booking_date::text || ' ' || NEW.start_time::text)::timestamptz,
            (NEW.booking_date::text || ' ' || NEW.end_time::text)::timestamptz,
            '[)'
          )
  ) THEN
    RAISE EXCEPTION 'Court has a scheduled event at this time';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_booking_court_conflict ON public.bookings;
CREATE TRIGGER trg_prevent_booking_court_conflict
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_booking_court_conflict();

CREATE OR REPLACE FUNCTION public.prevent_event_court_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.court_id IS NULL OR NEW.status NOT IN ('published', 'full') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.court_id = NEW.court_id
      AND e.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND e.status IN ('published', 'full')
      AND tstzrange(e.start_datetime, e.end_datetime, '[)') &&
          tstzrange(NEW.start_datetime, NEW.end_datetime, '[)')
  ) THEN
    RAISE EXCEPTION 'Court already has another event at this time';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.court_id = NEW.court_id
      AND b.status IN ('pending', 'confirmed')
      AND tstzrange(
            (b.booking_date::text || ' ' || b.start_time::text)::timestamptz,
            (b.booking_date::text || ' ' || b.end_time::text)::timestamptz,
            '[)'
          ) && tstzrange(NEW.start_datetime, NEW.end_datetime, '[)')
  ) THEN
    RAISE EXCEPTION 'Court is already booked at this time';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_event_court_conflict ON public.events;
CREATE TRIGGER trg_prevent_event_court_conflict
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_event_court_conflict();


-- ============================================================
-- 2. NOTIFICATION TRIGGERS
-- ============================================================

-- Booking notifications: created/confirmed/cancelled
CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_name text;
  v_coach_name text;
  v_date_label text;
BEGIN
  SELECT full_name INTO v_player_name FROM public.profiles WHERE user_id = NEW.player_id;
  SELECT full_name INTO v_coach_name FROM public.profiles WHERE user_id = NEW.coach_id;
  v_date_label := to_char(NEW.booking_date, 'Mon DD') || ' at ' || to_char(NEW.start_time, 'HH24:MI');

  IF TG_OP = 'INSERT' THEN
    -- Notify coach of new booking
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.coach_id,
      'New booking request',
      COALESCE(v_player_name, 'A player') || ' booked a session for ' || v_date_label,
      '/coach/calendar'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Confirmed
    IF OLD.status <> 'confirmed' AND NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, title, body, link)
      VALUES (
        NEW.player_id,
        'Booking confirmed',
        'Your session with ' || COALESCE(v_coach_name, 'your coach') || ' on ' || v_date_label || ' is confirmed.',
        '/dashboard'
      );
    END IF;
    -- Cancelled
    IF OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
      -- Notify the other party
      IF NEW.cancelled_by = NEW.player_id THEN
        INSERT INTO public.notifications (user_id, title, body, link)
        VALUES (
          NEW.coach_id,
          'Booking cancelled',
          COALESCE(v_player_name, 'A player') || ' cancelled the session on ' || v_date_label || '.',
          '/coach/calendar'
        );
      ELSE
        INSERT INTO public.notifications (user_id, title, body, link)
        VALUES (
          NEW.player_id,
          'Booking cancelled',
          'Your session with ' || COALESCE(v_coach_name, 'your coach') || ' on ' || v_date_label || ' was cancelled.',
          '/dashboard'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_booking_event ON public.bookings;
CREATE TRIGGER trg_notify_booking_event
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_event();


-- Coach request status notifications (notify player on accept/reject)
CREATE OR REPLACE FUNCTION public.notify_coach_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach_name text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('accepted', 'rejected') THEN
    SELECT full_name INTO v_coach_name FROM public.profiles WHERE user_id = NEW.coach_id;
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.player_id,
      CASE WHEN NEW.status = 'accepted' THEN 'Coach accepted your request' ELSE 'Coach declined your request' END,
      COALESCE(v_coach_name, 'Your coach') || ' ' || NEW.status || ' your training request.',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_coach_request_status ON public.coach_requests;
CREATE TRIGGER trg_notify_coach_request_status
  AFTER UPDATE ON public.coach_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_coach_request_status();


-- Club invite accepted → notify inviter
CREATE OR REPLACE FUNCTION public.notify_club_invite_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_name text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.accepted_at IS NULL AND NEW.accepted_at IS NOT NULL THEN
    SELECT name INTO v_club_name FROM public.clubs WHERE id = NEW.club_id;
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      NEW.invited_by,
      'Invite accepted',
      NEW.email || ' joined ' || COALESCE(v_club_name, 'your club') || '.',
      '/club/coaches'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_club_invite_accepted ON public.club_invites;
CREATE TRIGGER trg_notify_club_invite_accepted
  AFTER UPDATE ON public.club_invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_club_invite_accepted();


-- ============================================================
-- 3. PLAYER "MY CLUB" AFFILIATION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.club_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  followed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

ALTER TABLE public.club_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read follow counts"
  ON public.club_followers FOR SELECT
  USING (true);

CREATE POLICY "Users manage own follows"
  ON public.club_followers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Club managers see followers"
  ON public.club_followers FOR SELECT
  USING (public.is_club_manager(auth.uid(), club_id));

CREATE INDEX IF NOT EXISTS idx_club_followers_user ON public.club_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_club_followers_club ON public.club_followers(club_id);


-- ============================================================
-- 4. NEW EVENT in club → notify followers
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_followers_of_new_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_follower_id uuid;
  v_club_name text;
BEGIN
  IF NEW.club_id IS NULL OR NEW.status <> 'published' THEN
    RETURN NEW;
  END IF;

  -- Only on first publish, not on updates of already-published events
  IF TG_OP = 'UPDATE' AND OLD.status = 'published' THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_club_name FROM public.clubs WHERE id = NEW.club_id;

  FOR v_follower_id IN
    SELECT user_id FROM public.club_followers WHERE club_id = NEW.club_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (
      v_follower_id,
      'New event at ' || COALESCE(v_club_name, 'your club'),
      NEW.title || ' on ' || to_char(NEW.start_datetime, 'Mon DD'),
      '/events'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_followers_of_new_event ON public.events;
CREATE TRIGGER trg_notify_followers_of_new_event
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_followers_of_new_event();
