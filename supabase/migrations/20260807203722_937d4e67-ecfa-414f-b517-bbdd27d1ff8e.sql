CREATE OR REPLACE FUNCTION public.get_class_roster_candidates(_event_id uuid)
RETURNS TABLE(player_id uuid, full_name text, level numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_coach uuid;
BEGIN
  IF NOT public.can_manage_event(auth.uid(), _event_id) THEN
    RETURN;
  END IF;

  SELECT e.coach_id INTO v_coach FROM public.events e WHERE e.id = _event_id;

  RETURN QUERY
  SELECT DISTINCT p.user_id,
         COALESCE(p.full_name, p.email, 'Player'),
         COALESCE(pp.playtomic_level, pp.current_usta_ntrp)
  FROM public.coach_player_assignments a
  JOIN public.profiles p ON p.user_id = a.player_id
  LEFT JOIN public.player_profiles pp ON pp.user_id = a.player_id
  WHERE a.coach_id = v_coach
  ORDER BY 2;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_class_roster_candidates(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_class_roster_candidates(uuid) TO authenticated;