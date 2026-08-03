-- 1. coach_invites: phone + clubs
ALTER TABLE public.coach_invites
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS clubs jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. player_profiles: clubs list
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS clubs jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.player_profiles
SET clubs = jsonb_build_array(jsonb_build_object('name', club_name, 'city', COALESCE(club_location, '')))
WHERE clubs = '[]'::jsonb AND COALESCE(club_name, '') <> '';

-- 3. player_assessments: allow invite-attached (pre-signup) assessments
ALTER TABLE public.player_assessments
  ALTER COLUMN player_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS invite_id uuid REFERENCES public.coach_invites(id) ON DELETE CASCADE;

ALTER TABLE public.player_assessments
  DROP CONSTRAINT IF EXISTS player_assessments_target_check;
ALTER TABLE public.player_assessments
  ADD CONSTRAINT player_assessments_target_check
  CHECK (player_id IS NOT NULL OR invite_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS player_assessments_invite_id_idx
  ON public.player_assessments (invite_id);

-- 4. RLS: coach owns assessments attached to their own invites
DROP POLICY IF EXISTS "Coaches manage assessments on own invites" ON public.player_assessments;
CREATE POLICY "Coaches manage assessments on own invites"
ON public.player_assessments
FOR ALL
TO authenticated
USING (
  invite_id IS NOT NULL
  AND coach_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.coach_invites i WHERE i.id = invite_id AND i.coach_id = auth.uid())
)
WITH CHECK (
  invite_id IS NOT NULL
  AND coach_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.coach_invites i WHERE i.id = invite_id AND i.coach_id = auth.uid())
);

-- 5. Public teaser lookup: coach + summary level only, no per-shot values, no notes
DROP FUNCTION IF EXISTS public.get_coach_invite(text);
CREATE OR REPLACE FUNCTION public.get_coach_invite(_token text)
 RETURNS TABLE(
   coach_id uuid,
   coach_name text,
   coach_avatar text,
   full_name text,
   email text,
   phone text,
   is_valid boolean,
   has_assessment boolean,
   assessment_date date,
   sport text,
   overall_level numeric,
   level_system text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT i.coach_id,
         p.full_name,
         p.avatar_url,
         i.full_name,
         i.email,
         i.phone,
         (i.accepted_at IS NULL AND i.expires_at > now()),
         (a.id IS NOT NULL),
         a.assessment_date,
         a.sport,
         a.overall_level,
         a.level_system
  FROM public.coach_invites i
  LEFT JOIN public.profiles p ON p.user_id = i.coach_id
  LEFT JOIN LATERAL (
    SELECT id, assessment_date, sport, overall_level, level_system
    FROM public.player_assessments
    WHERE invite_id = i.id
    ORDER BY assessment_date DESC, created_at DESC
    LIMIT 1
  ) a ON true
  WHERE i.token = _token
  LIMIT 1
$function$;

-- 6. Claim: link coach, migrate assessments, seed the profile
CREATE OR REPLACE FUNCTION public.claim_coach_invite(_token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inv RECORD;
  v_last RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_inv
  FROM public.coach_invites
  WHERE token = _token
    AND (accepted_at IS NULL OR accepted_by = auth.uid())
    AND expires_at > now()
  LIMIT 1;

  IF v_inv IS NULL OR v_inv.coach_id = auth.uid() THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.coach_player_assignments
    WHERE coach_id = v_inv.coach_id AND player_id = auth.uid()
  ) THEN
    INSERT INTO public.coach_player_assignments (coach_id, player_id)
    VALUES (v_inv.coach_id, auth.uid());
  END IF;

  -- Transfer any pre-signup assessments to this account
  UPDATE public.player_assessments
  SET player_id = auth.uid()
  WHERE invite_id = v_inv.id AND player_id IS NULL;

  SELECT * INTO v_last
  FROM public.player_assessments
  WHERE invite_id = v_inv.id
  ORDER BY assessment_date DESC, created_at DESC
  LIMIT 1;

  INSERT INTO public.player_profiles (user_id) VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.player_profiles pp
  SET clubs = CASE WHEN pp.clubs = '[]'::jsonb AND v_inv.clubs <> '[]'::jsonb THEN v_inv.clubs ELSE pp.clubs END,
      volley_pct   = COALESCE(v_last.volley_pct, pp.volley_pct),
      forehand_pct = COALESCE(v_last.forehand_pct, pp.forehand_pct),
      serve_pct    = COALESCE(v_last.serve_pct, pp.serve_pct),
      smash_pct    = COALESCE(v_last.smash_pct, pp.smash_pct),
      backhand_pct = COALESCE(v_last.backhand_pct, pp.backhand_pct),
      lob_pct      = COALESCE(v_last.lob_pct, pp.lob_pct),
      playtomic_level = COALESCE(pp.playtomic_level, v_last.overall_level),
      shot_data_source = CASE WHEN v_last.id IS NOT NULL THEN 'coach'::shot_data_source ELSE pp.shot_data_source END
  WHERE pp.user_id = auth.uid();

  UPDATE public.profiles
  SET phone = COALESCE(NULLIF(phone, ''), v_inv.phone)
  WHERE user_id = auth.uid();

  UPDATE public.coach_invites
  SET accepted_at = COALESCE(accepted_at, now()), accepted_by = auth.uid()
  WHERE id = v_inv.id;

  RETURN v_inv.coach_id;
END;
$function$;