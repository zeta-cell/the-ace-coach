CREATE TABLE public.coach_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  note text,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_invites TO authenticated;
GRANT ALL ON public.coach_invites TO service_role;

ALTER TABLE public.coach_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their own invites"
  ON public.coach_invites FOR ALL TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coach_invites_updated_at
  BEFORE UPDATE ON public.coach_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public (pre-signup) lookup of an invite by token: exposes only coach name + validity
CREATE OR REPLACE FUNCTION public.get_coach_invite(_token text)
RETURNS TABLE(coach_id uuid, coach_name text, coach_avatar text, full_name text, email text, is_valid boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.coach_id,
         p.full_name,
         p.avatar_url,
         i.full_name,
         i.email,
         (i.accepted_at IS NULL AND i.expires_at > now())
  FROM public.coach_invites i
  LEFT JOIN public.profiles p ON p.user_id = i.coach_id
  WHERE i.token = _token
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_coach_invite(text) TO anon, authenticated;

-- Claim an invite after signing up (email/password, Google or Apple)
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

  INSERT INTO public.coach_player_assignments (coach_id, player_id, status)
  VALUES (v_coach, auth.uid(), 'active')
  ON CONFLICT DO NOTHING;

  UPDATE public.coach_invites
  SET accepted_at = now(), accepted_by = auth.uid()
  WHERE token = _token;

  RETURN v_coach;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_coach_invite(text) TO authenticated;

-- Self-assign to a coach (used when a player signs up without an invite link)
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

  INSERT INTO public.coach_player_assignments (coach_id, player_id, status)
  VALUES (_coach_id, auth.uid(), 'active')
  ON CONFLICT DO NOTHING;

  RETURN _coach_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_self_to_coach(uuid) TO authenticated;