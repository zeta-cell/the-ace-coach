GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.clubs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;

GRANT SELECT ON public.club_coaches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_coaches TO authenticated;
GRANT ALL ON public.club_coaches TO service_role;

GRANT SELECT ON public.club_courts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_courts TO authenticated;
GRANT ALL ON public.club_courts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_followers TO authenticated;
GRANT ALL ON public.club_followers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_invites TO authenticated;
GRANT ALL ON public.club_invites TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;