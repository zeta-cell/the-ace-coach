
-- 1) LEADERBOARD: read-only for clients
DROP POLICY IF EXISTS "Users update own entry" ON public.leaderboard;

-- 2) USER_STATS: read-only for clients
DROP POLICY IF EXISTS "Users update own stats" ON public.user_stats;

-- 3) USER_XP_EVENTS: remove client INSERT
DROP POLICY IF EXISTS "System inserts XP events" ON public.user_xp_events;

-- 4) USER_BADGES: remove client INSERT
DROP POLICY IF EXISTS "System grants badges" ON public.user_badges;

-- 5) REFERRALS: tighten update + server-side claim helper
DROP POLICY IF EXISTS "Referred users can update their referral" ON public.referrals;
CREATE POLICY "Referred users update own referral"
ON public.referrals
FOR UPDATE
TO authenticated
USING (auth.uid() = referred_id)
WITH CHECK (auth.uid() = referred_id);

CREATE OR REPLACE FUNCTION public.claim_referral(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_id uuid;
  v_referrer_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT user_id INTO v_referrer_id FROM public.profiles WHERE referral_code = _code LIMIT 1;
  IF v_referrer_id IS NULL OR v_referrer_id = auth.uid() THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, auth.uid(), 'signed_up')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_referral_id;
  RETURN v_referral_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;

-- 6) COACH_PROFILES: explicit INSERT policy
DROP POLICY IF EXISTS "Coaches can insert own profile" ON public.coach_profiles;
CREATE POLICY "Coaches can insert own profile"
ON public.coach_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'coach'::app_role));

-- 7a) PROFILES: restrict sensitive columns via column-level GRANTs
DROP POLICY IF EXISTS "Public can read basic profiles" ON public.profiles;

REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT (user_id, full_name, avatar_url, created_at) ON public.profiles TO anon;

DROP POLICY IF EXISTS "Public can read safe profile columns" ON public.profiles;
CREATE POLICY "Public can read safe profile columns"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- 7b) COACH_PROFILES: restrict phone column from anon
DROP POLICY IF EXISTS "Public can read coach profiles" ON public.coach_profiles;

REVOKE ALL ON public.coach_profiles FROM anon;
GRANT SELECT (
  id, user_id, bio, years_experience, certifications, specializations,
  languages, nationality, location_city, location_country, location_lat, location_lng,
  profile_slug, is_verified, badge_level, total_sessions_coached, response_time_hours,
  primary_sport, coaching_style, dominant_hand, preferred_side,
  racket_brand, racket_model, racket_type, hourly_rate_from,
  playtomic_level, playtomic_url,
  serve_pct, forehand_pct, backhand_pct, volley_pct, smash_pct, lob_pct,
  best_shot, weakest_shot, created_at, updated_at
) ON public.coach_profiles TO anon;

CREATE POLICY "Public can read coach profile columns"
ON public.coach_profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- 8) STORAGE: attachments — allow message recipients to read
DROP POLICY IF EXISTS "Message recipients can read attachments" ON storage.objects;
CREATE POLICY "Message recipients can read attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.attachment_url LIKE '%' || storage.objects.name
      AND m.receiver_id = auth.uid()
  )
);
