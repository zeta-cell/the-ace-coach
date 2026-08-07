-- Enforce class rules on sign-up (players only; staff can override)
CREATE OR REPLACE FUNCTION public.event_registrations_enforce_rules()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ev RECORD;
  lvl numeric;
  taken integer;
BEGIN
  SELECT * INTO ev FROM public.events WHERE id = NEW.event_id;
  IF ev IS NULL THEN
    RAISE EXCEPTION 'Class not found';
  END IF;

  -- staff bypass
  IF public.can_manage_event(auth.uid(), NEW.event_id) THEN
    NEW.added_by_coach := true;
    RETURN NEW;
  END IF;

  IF ev.status NOT IN ('published', 'full') THEN
    RAISE EXCEPTION 'This class is not open for registration';
  END IF;

  IF ev.registration_deadline IS NOT NULL AND ev.registration_deadline < now() THEN
    RAISE EXCEPTION 'Registration for this class has closed';
  END IF;

  SELECT count(*) INTO taken
  FROM public.event_registrations r
  WHERE r.event_id = NEW.event_id AND COALESCE(r.status, 'registered') <> 'cancelled';

  IF ev.max_participants IS NOT NULL AND taken >= ev.max_participants THEN
    RAISE EXCEPTION 'This class is full';
  END IF;

  IF ev.level_min IS NOT NULL OR ev.level_max IS NOT NULL THEN
    SELECT COALESCE(playtomic_level, current_usta_ntrp) INTO lvl
    FROM public.player_profiles WHERE user_id = NEW.player_id;
    IF lvl IS NULL THEN
      RAISE EXCEPTION 'This class has a level requirement — add your level to your profile first';
    END IF;
    IF (ev.level_min IS NOT NULL AND lvl < ev.level_min)
       OR (ev.level_max IS NOT NULL AND lvl > ev.level_max) THEN
      RAISE EXCEPTION 'Your level is outside the range for this class';
    END IF;
  END IF;

  NEW.added_by_coach := false;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.event_registrations_enforce_rules() FROM anon, public;

DROP TRIGGER IF EXISTS event_registrations_enforce_rules_ins ON public.event_registrations;
CREATE TRIGGER event_registrations_enforce_rules_ins
BEFORE INSERT ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.event_registrations_enforce_rules();

-- Attendee list, privacy-aware
CREATE OR REPLACE FUNCTION public.get_class_attendees(_event_id uuid)
RETURNS TABLE(
  registration_id uuid,
  player_id uuid,
  full_name text,
  avatar_url text,
  level numeric,
  status text,
  attended boolean,
  added_by_coach boolean,
  registered_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (
    public.can_manage_event(auth.uid(), _event_id)
    OR public.is_event_attendee(auth.uid(), _event_id)
    OR public.event_attendees_public(_event_id)
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.id, r.player_id, COALESCE(p.full_name, 'Player'), p.avatar_url,
         COALESCE(pp.playtomic_level, pp.current_usta_ntrp),
         COALESCE(r.status, 'registered'), r.attended, r.added_by_coach, r.registered_at
  FROM public.event_registrations r
  LEFT JOIN public.profiles p ON p.user_id = r.player_id
  LEFT JOIN public.player_profiles pp ON pp.user_id = r.player_id
  WHERE r.event_id = _event_id
    AND COALESCE(r.status, 'registered') <> 'cancelled'
  ORDER BY r.registered_at;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_class_attendees(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_class_attendees(uuid) TO anon, authenticated;

-- Message authors (name/avatar) for a class thread
CREATE OR REPLACE FUNCTION public.get_class_thread(_event_id uuid)
RETURNS TABLE(
  id uuid,
  author_id uuid,
  author_name text,
  author_avatar text,
  is_coach boolean,
  content text,
  attachment_url text,
  is_announcement boolean,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.can_manage_event(auth.uid(), _event_id) OR public.is_event_attendee(auth.uid(), _event_id)) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT m.id, m.author_id, COALESCE(p.full_name, 'Player'), p.avatar_url,
         (m.author_id = e.coach_id), m.content, m.attachment_url, m.is_announcement, m.created_at
  FROM public.event_messages m
  JOIN public.events e ON e.id = m.event_id
  LEFT JOIN public.profiles p ON p.user_id = m.author_id
  WHERE m.event_id = _event_id
  ORDER BY m.created_at;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_class_thread(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_class_thread(uuid) TO authenticated;