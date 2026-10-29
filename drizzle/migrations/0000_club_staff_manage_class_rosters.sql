CREATE OR REPLACE FUNCTION public.event_registrations_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.can_manage_event(auth.uid(), NEW.event_id) THEN
    RETURN NEW;
  END IF;
  NEW.event_id := OLD.event_id;
  NEW.player_id := OLD.player_id;
  NEW.payment_status := OLD.payment_status;
  NEW.amount_paid := OLD.amount_paid;
  NEW.registered_at := OLD.registered_at;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_class_roster_candidates(_event_id uuid)
RETURNS TABLE(player_id uuid, full_name text, level numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_coach uuid;
  v_club uuid;
BEGIN
  IF NOT public.can_manage_event(auth.uid(), _event_id) THEN
    RETURN;
  END IF;
  SELECT e.coach_id, e.club_id INTO v_coach, v_club FROM public.events e WHERE e.id = _event_id;

  RETURN QUERY
  WITH ids AS (
    SELECT a.player_id AS uid FROM public.coach_player_assignments a
    WHERE a.coach_id = v_coach
       OR a.coach_id IN (
         SELECT cc.coach_id FROM public.club_coaches cc
         WHERE cc.club_id IN (SELECT public.get_user_clubs(auth.uid()))
            OR cc.club_id = v_club)
    UNION
    SELECT b.player_id FROM public.bookings b
    WHERE b.club_id IS NOT NULL AND (b.club_id = v_club OR b.club_id IN (SELECT public.get_user_clubs(auth.uid())))
    UNION
    SELECT f.user_id FROM public.club_followers f
    WHERE f.club_id = v_club OR f.club_id IN (SELECT public.get_user_clubs(auth.uid()))
  )
  SELECT DISTINCT p.user_id,
         COALESCE(p.full_name, p.email, 'Player'),
         COALESCE(pp.playtomic_level, pp.current_usta_ntrp)
  FROM ids
  JOIN public.profiles p ON p.user_id = ids.uid
  LEFT JOIN public.player_profiles pp ON pp.user_id = ids.uid
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = ids.uid AND r.role IN ('coach','club_manager','admin'))
  ORDER BY 2;
END;
$$;