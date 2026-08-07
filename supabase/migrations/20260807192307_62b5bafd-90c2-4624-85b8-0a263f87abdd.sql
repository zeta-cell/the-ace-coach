CREATE OR REPLACE FUNCTION public.get_coach_join_info(_slug text)
RETURNS TABLE(coach_id uuid, coach_name text, coach_avatar text, bio text, is_valid boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  SELECT cp.user_id INTO _id
  FROM public.coach_profiles cp
  WHERE cp.profile_slug = _slug
  LIMIT 1;

  IF _id IS NULL THEN
    BEGIN
      _id := _slug::uuid;
    EXCEPTION WHEN others THEN
      _id := NULL;
    END;
  END IF;

  IF _id IS NULL OR NOT public.has_role(_id, 'coach') THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, NULL::text, false;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.full_name, p.avatar_url, cp.bio, true
  FROM public.profiles p
  LEFT JOIN public.coach_profiles cp ON cp.user_id = p.user_id
  WHERE p.user_id = _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_coach_join_info(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.join_coach(_slug text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _me uuid := auth.uid();
  _name text;
  _email text;
  _phone text;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT cp.user_id INTO _id FROM public.coach_profiles cp WHERE cp.profile_slug = _slug LIMIT 1;
  IF _id IS NULL THEN
    BEGIN
      _id := _slug::uuid;
    EXCEPTION WHEN others THEN
      _id := NULL;
    END;
  END IF;

  IF _id IS NULL OR _id = _me OR NOT public.has_role(_id, 'coach') THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.coach_player_assignments
    WHERE coach_id = _id AND player_id = _me
  ) THEN
    INSERT INTO public.coach_player_assignments (coach_id, player_id)
    VALUES (_id, _me);
  END IF;

  SELECT p.full_name, p.email, p.phone INTO _name, _email, _phone
  FROM public.profiles p WHERE p.user_id = _me;

  IF NOT EXISTS (
    SELECT 1 FROM public.crm_clients
    WHERE owner_id = _id AND owner_type = 'coach' AND linked_user_id = _me
  ) THEN
    INSERT INTO public.crm_clients (owner_id, owner_type, full_name, email, phone, source, status, pipeline_stage, linked_user_id)
    VALUES (_id, 'coach', COALESCE(_name, 'New player'), _email, _phone, 'coach_link', 'active', 'lead', _me);
  END IF;

  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_coach(text) TO authenticated;