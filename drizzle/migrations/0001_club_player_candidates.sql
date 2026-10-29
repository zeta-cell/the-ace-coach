CREATE OR REPLACE FUNCTION public.get_club_player_candidates(_club_id uuid)
RETURNS TABLE(player_id uuid, full_name text, level numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_club_manager(auth.uid(), _club_id) OR public.has_role(auth.uid(), 'admin')) THEN
    RETURN;
  END IF;
  RETURN QUERY
  WITH ids AS (
    SELECT a.player_id AS uid FROM public.coach_player_assignments a
    WHERE a.coach_id IN (SELECT cc.coach_id FROM public.club_coaches cc WHERE cc.club_id = _club_id)
    UNION SELECT b.player_id FROM public.bookings b WHERE b.club_id = _club_id
    UNION SELECT f.user_id FROM public.club_followers f WHERE f.club_id = _club_id
    UNION SELECT r.player_id FROM public.event_registrations r JOIN public.events e ON e.id = r.event_id WHERE e.club_id = _club_id
  )
  SELECT DISTINCT p.user_id, COALESCE(p.full_name, p.email, 'Player'),
         COALESCE(pp.playtomic_level, pp.current_usta_ntrp)
  FROM ids
  JOIN public.profiles p ON p.user_id = ids.uid
  LEFT JOIN public.player_profiles pp ON pp.user_id = ids.uid
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = ids.uid AND r.role IN ('coach','club_manager','admin'))
  ORDER BY 2;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_club_player_candidates(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_club_player_candidates(uuid) TO authenticated;