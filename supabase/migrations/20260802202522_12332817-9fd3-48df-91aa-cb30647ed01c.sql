CREATE OR REPLACE FUNCTION public.claim_coach_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coach uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT coach_id INTO v_coach
  FROM public.coach_invites
  WHERE token = _token AND accepted_at IS NULL AND expires_at > now()
  LIMIT 1;

  IF v_coach IS NULL OR v_coach = auth.uid() THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.coach_player_assignments
    WHERE coach_id = v_coach AND player_id = auth.uid()
  ) THEN
    INSERT INTO public.coach_player_assignments (coach_id, player_id)
    VALUES (v_coach, auth.uid());
  END IF;

  UPDATE public.coach_invites
  SET accepted_at = now(), accepted_by = auth.uid()
  WHERE token = _token;

  RETURN v_coach;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_self_to_coach(_coach_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _coach_id = auth.uid() OR NOT public.has_role(_coach_id, 'coach') THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.coach_player_assignments
    WHERE coach_id = _coach_id AND player_id = auth.uid()
  ) THEN
    INSERT INTO public.coach_player_assignments (coach_id, player_id)
    VALUES (_coach_id, auth.uid());
  END IF;

  RETURN _coach_id;
END;
$$;