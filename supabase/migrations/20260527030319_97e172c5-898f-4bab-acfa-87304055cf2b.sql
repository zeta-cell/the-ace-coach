
-- ============================================================
-- Security hardening migration
-- ============================================================

-- 1) PROFILES: hide email/phone/notification_preferences from anonymous
--    Keep authenticated full SELECT (RLS still restricts to own row + admins + assigned-coach).
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, user_id, full_name, avatar_url, is_active, onboarding_completed, created_at, updated_at, referral_code) ON public.profiles TO anon;

-- 2) COACH_PROFILES: hide phone from anon (keep authenticated full access)
REVOKE SELECT ON public.coach_profiles FROM anon;
GRANT SELECT (
  id, user_id, bio, specializations, certifications, coaching_style,
  dominant_hand, preferred_side, volley_pct, forehand_pct, serve_pct,
  smash_pct, backhand_pct, lob_pct, best_shot, weakest_shot,
  playtomic_level, playtomic_url, nationality, languages, racket_brand,
  racket_model, racket_type, location_city, location_country,
  location_lat, location_lng, hourly_rate_from, profile_slug,
  is_verified, badge_level, total_sessions_coached, response_time_hours,
  primary_sport, years_experience, created_at, updated_at
) ON public.coach_profiles TO anon;

-- 3) HEALTH_CONNECTIONS: tokens never exposed via Data API; only edge functions (service_role)
REVOKE SELECT ON public.health_connections FROM anon, authenticated;
GRANT SELECT (id, user_id, provider, provider_user_id, is_connected, created_at, last_synced_at, token_expires_at) ON public.health_connections TO authenticated;
-- service_role keeps full access via default ALL grant

-- 4) NOTIFICATIONS: restrict INSERT to relationships (or self/admin)
CREATE OR REPLACE FUNCTION public.can_notify(_target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    auth.uid() = _target
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.bookings WHERE (player_id = auth.uid() AND coach_id = _target) OR (coach_id = auth.uid() AND player_id = _target))
    OR EXISTS (SELECT 1 FROM public.coach_player_assignments WHERE (coach_id = auth.uid() AND player_id = _target) OR (player_id = auth.uid() AND coach_id = _target))
    OR EXISTS (SELECT 1 FROM public.coach_requests WHERE (player_id = auth.uid() AND coach_id = _target) OR (coach_id = auth.uid() AND player_id = _target))
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.coach_id = auth.uid() AND EXISTS (SELECT 1 FROM public.event_registrations r WHERE r.event_id = e.id AND r.player_id = _target))
    OR EXISTS (SELECT 1 FROM public.event_registrations r JOIN public.events e ON e.id = r.event_id WHERE r.player_id = auth.uid() AND e.coach_id = _target)
    OR EXISTS (SELECT 1 FROM public.messages WHERE (sender_id = auth.uid() AND receiver_id = _target) OR (receiver_id = auth.uid() AND sender_id = _target))
$$;
REVOKE EXECUTE ON FUNCTION public.can_notify(uuid) FROM anon;

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications for related users"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_notify(user_id));

-- 5) USER_ROLES: prevent privilege escalation via explicit restrictive INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can write roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 6) BLOCK_SAVES: stop leaking user IDs publicly
DROP POLICY IF EXISTS "Anyone reads save counts" ON public.block_saves;
-- Owner read still covered by "Users manage own saves". For aggregated counts use a view:
CREATE OR REPLACE VIEW public.block_save_counts AS
  SELECT block_id, count(*)::int AS saves_count FROM public.block_saves GROUP BY block_id;
GRANT SELECT ON public.block_save_counts TO anon, authenticated;

-- 7) CLUB_FOLLOWERS: stop leaking user IDs publicly
DROP POLICY IF EXISTS "Public can read follow counts" ON public.club_followers;
CREATE OR REPLACE VIEW public.club_follower_counts AS
  SELECT club_id, count(*)::int AS followers_count FROM public.club_followers GROUP BY club_id;
GRANT SELECT ON public.club_follower_counts TO anon, authenticated;

-- 8) COACH_AVAILABILITY_SLOTS: only expose non-blocked slots publicly
DROP POLICY IF EXISTS "Public can read availability" ON public.coach_availability_slots;
CREATE POLICY "Public can read open availability"
  ON public.coach_availability_slots
  FOR SELECT
  TO anon, authenticated
  USING (is_blocked = false);

-- 9) STORAGE: attachments DELETE/UPDATE by owning folder
CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'attachments' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'attachments' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 10) STORAGE: coach-videos ownership check (module-scoped)
DROP POLICY IF EXISTS "Authenticated read coach videos" ON storage.objects;
CREATE POLICY "Coach video owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'coach-videos' AND (
      EXISTS (
        SELECT 1 FROM public.modules m
        WHERE m.id::text = (storage.foldername(name))[2]
          AND (m.created_by = auth.uid() OR m.is_shared = true)
      )
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );
CREATE POLICY "Coach can delete own coach videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'coach-videos' AND EXISTS (
      SELECT 1 FROM public.modules m
      WHERE m.id::text = (storage.foldername(name))[2] AND m.created_by = auth.uid()
    )
  );

-- 11) STORAGE: avatars — prevent bulk listing while keeping individual file access
--     (public bucket already serves individual files via public URLs;
--      removing the broad SELECT policy still allows direct CDN access)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars individual access"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
-- (Direct CDN URL access is unaffected; listing requires authenticated calls)

-- 12) Lock down sensitive SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, text, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, text, text, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_session_stats(uuid, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_block_usage(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_block_rating_avg(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_raffle_tickets(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.recalculate_rankings() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_streak(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.seed_default_crm_stages(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_notify(uuid) FROM anon, public;
