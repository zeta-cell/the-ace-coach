-- ============ EVENTS: clinic settings ============
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS min_participants integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cancellation_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS cancellation_policy text,
  ADD COLUMN IF NOT EXISTS level_min numeric,
  ADD COLUMN IF NOT EXISTS level_max numeric,
  ADD COLUMN IF NOT EXISTS goals text,
  ADD COLUMN IF NOT EXISTS what_to_bring text,
  ADD COLUMN IF NOT EXISTS registration_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attendees_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS academy_id uuid REFERENCES public.academies(id) ON DELETE SET NULL;

-- ============ EVENT_REGISTRATIONS: attendance mgmt ============
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS attended boolean,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS added_by_coach boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coach_note text;

-- who can manage an event (coach, club manager, academy manager, admin)
CREATE OR REPLACE FUNCTION public.can_manage_event(_user_id uuid, _event_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = _event_id
      AND (
        e.coach_id = _user_id
        OR public.has_role(_user_id, 'admin')
        OR (e.club_id IS NOT NULL AND public.is_club_manager(_user_id, e.club_id))
        OR (e.academy_id IS NOT NULL AND public.is_academy_manager(_user_id, e.academy_id))
        OR public.manages_academy_coach(_user_id, e.coach_id)
      )
  )
$$;

-- is the user an active attendee of the event
CREATE OR REPLACE FUNCTION public.is_event_attendee(_user_id uuid, _event_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_registrations r
    WHERE r.event_id = _event_id
      AND r.player_id = _user_id
      AND COALESCE(r.status, 'registered') <> 'cancelled'
  )
$$;

CREATE OR REPLACE FUNCTION public.event_attendees_public(_event_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT attendees_visible FROM public.events WHERE id = _event_id), false)
$$;

DROP POLICY IF EXISTS "Coaches manage registrations for own events" ON public.event_registrations;
CREATE POLICY "Coaches manage registrations for own events"
ON public.event_registrations FOR ALL TO authenticated
USING (public.can_manage_event(auth.uid(), event_id))
WITH CHECK (public.can_manage_event(auth.uid(), event_id));

DROP POLICY IF EXISTS "Attendees see fellow attendees" ON public.event_registrations;
CREATE POLICY "Attendees see fellow attendees"
ON public.event_registrations FOR SELECT TO authenticated
USING (
  public.is_event_attendee(auth.uid(), event_id)
  OR public.event_attendees_public(event_id)
);

-- ============ EVENT MESSAGES (group thread + announcements) ============
CREATE TABLE IF NOT EXISTS public.event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  attachment_url text,
  is_announcement boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_messages_event_idx ON public.event_messages(event_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_messages TO authenticated;
GRANT ALL ON public.event_messages TO service_role;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members read thread"
ON public.event_messages FOR SELECT TO authenticated
USING (public.is_event_attendee(auth.uid(), event_id) OR public.can_manage_event(auth.uid(), event_id));

CREATE POLICY "Class members post"
ON public.event_messages FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (public.is_event_attendee(auth.uid(), event_id) OR public.can_manage_event(auth.uid(), event_id))
  AND (is_announcement = false OR public.can_manage_event(auth.uid(), event_id))
);

CREATE POLICY "Authors delete own posts"
ON public.event_messages FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.can_manage_event(auth.uid(), event_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;

-- ============ RENTAL ITEMS ============
CREATE TABLE IF NOT EXISTS public.rental_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  owner_type text NOT NULL DEFAULT 'coach',
  name text NOT NULL,
  category text NOT NULL DEFAULT 'racket',
  description text,
  price_per_session numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  quantity_available integer NOT NULL DEFAULT 1,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rental_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_items TO authenticated;
GRANT ALL ON public.rental_items TO service_role;
ALTER TABLE public.rental_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active rentals" ON public.rental_items FOR SELECT USING (is_active = true);
CREATE POLICY "Owners manage rentals" ON public.rental_items FOR ALL TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER rental_items_updated_at BEFORE UPDATE ON public.rental_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BOOKING RENTALS (add-on at booking) ============
CREATE TABLE IF NOT EXISTS public.booking_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rental_item_id uuid NOT NULL REFERENCES public.rental_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_rentals TO authenticated;
GRANT ALL ON public.booking_rentals TO service_role;
ALTER TABLE public.booking_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking parties read rentals" ON public.booking_rentals FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.player_id = auth.uid() OR b.coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Players add rentals to own booking" ON public.booking_rentals FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.player_id = auth.uid() OR b.coach_id = auth.uid())));

CREATE POLICY "Booking parties remove rentals" ON public.booking_rentals FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.player_id = auth.uid() OR b.coach_id = auth.uid())));

-- server-side price: always taken from the rental item, never the client
CREATE OR REPLACE FUNCTION public.booking_rentals_enforce_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it RECORD;
BEGIN
  SELECT * INTO it FROM public.rental_items WHERE id = NEW.rental_item_id;
  IF it IS NULL OR it.is_active = false THEN
    RAISE EXCEPTION 'Rental item unavailable';
  END IF;
  NEW.quantity := GREATEST(COALESCE(NEW.quantity, 1), 1);
  NEW.unit_price := it.price_per_session;
  NEW.currency := it.currency;
  RETURN NEW;
END;
$$;
CREATE TRIGGER booking_rentals_price_ins BEFORE INSERT OR UPDATE ON public.booking_rentals
FOR EACH ROW EXECUTE FUNCTION public.booking_rentals_enforce_price();

-- ============ COACH PROMO / SHOPPING CODES ============
CREATE TABLE IF NOT EXISTS public.coach_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  brand text NOT NULL,
  code text NOT NULL,
  description text,
  discount_label text,
  url text,
  logo_url text,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coach_promo_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_promo_codes TO authenticated;
GRANT ALL ON public.coach_promo_codes TO service_role;
ALTER TABLE public.coach_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active codes" ON public.coach_promo_codes FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Coaches manage own codes" ON public.coach_promo_codes FOR ALL TO authenticated
USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER coach_promo_codes_updated_at BEFORE UPDATE ON public.coach_promo_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CERTIFICATES & TITLES ============
ALTER TABLE public.coach_certifications
  ADD COLUMN IF NOT EXISTS credential_type text NOT NULL DEFAULT 'certification',
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

-- only admins may flip is_verified
CREATE OR REPLACE FUNCTION public.certifications_guard_verified()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_verified := false;
    ELSE
      NEW.is_verified := OLD.is_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER certifications_guard_verified_trg BEFORE INSERT OR UPDATE ON public.coach_certifications
FOR EACH ROW EXECUTE FUNCTION public.certifications_guard_verified();

-- ============ REVIEWS: link to class or booking ============
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;