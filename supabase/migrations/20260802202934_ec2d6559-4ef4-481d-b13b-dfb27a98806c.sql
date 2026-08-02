CREATE OR REPLACE FUNCTION public.ensure_user_bootstrap(_full_name text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
  INTO v_email, v_name
  FROM auth.users WHERE id = v_uid;

  v_name := COALESCE(NULLIF(trim(COALESCE(_full_name, '')), ''), NULLIF(v_name, ''), split_part(COALESCE(v_email, 'player'), '@', 1));

  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (v_uid, v_name, COALESCE(v_email, ''))
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = CASE WHEN COALESCE(public.profiles.full_name, '') = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
      email = CASE WHEN COALESCE(public.profiles.email, '') = '' THEN EXCLUDED.email ELSE public.profiles.email END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'player')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.player_profiles (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_user_bootstrap(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_bootstrap(text) TO authenticated;