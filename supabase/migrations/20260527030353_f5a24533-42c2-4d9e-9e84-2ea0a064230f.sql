
-- 1) Views as SECURITY INVOKER (Postgres 15+)
ALTER VIEW public.block_save_counts SET (security_invoker = true);
ALTER VIEW public.club_follower_counts SET (security_invoker = true);

-- 2) page_views insert: require any authenticated/anon caller with explicit non-trivial check
DROP POLICY IF EXISTS "Anyone inserts page view" ON public.page_views;
CREATE POLICY "Tracked visitors insert page view"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (page_type IS NOT NULL);

-- 3) Avatars: drop broad SELECT to prevent bulk listing.
--    Direct CDN URLs (public bucket) continue to work for individual files.
DROP POLICY IF EXISTS "Avatars individual access" ON storage.objects;

-- 4) Revoke EXECUTE on trigger / internal SECURITY DEFINER functions from anon & authenticated.
--    Triggers don't need user EXECUTE; admin helpers below keep authenticated EXECUTE.
DO $$
DECLARE
  fn record;
  keep_for_users text[] := ARRAY[
    'has_role','is_club_manager','is_club_member','can_notify',
    'get_user_role','get_user_clubs','admin_get_stats','admin_list_users'
  ];
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    IF NOT (fn.proname = ANY(keep_for_users)) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public', fn.sig);
    END IF;
  END LOOP;
END $$;
