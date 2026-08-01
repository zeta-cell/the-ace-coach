REVOKE EXECUTE ON FUNCTION public.bookings_enforce_pricing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.event_registrations_guard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.club_invites_guard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.coach_requests_guard() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.block_purchases_enforce_pricing() FROM PUBLIC, anon, authenticated;