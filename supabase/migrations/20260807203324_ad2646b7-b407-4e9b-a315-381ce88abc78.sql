REVOKE EXECUTE ON FUNCTION public.can_manage_event(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_event_attendee(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.event_attendees_public(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.booking_rentals_enforce_price() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.certifications_guard_verified() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.can_manage_event(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_event_attendee(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_attendees_public(uuid) TO authenticated;