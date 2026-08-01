-- 1. BOOKINGS: server-authoritative pricing on insert + lock financial fields on update
CREATE OR REPLACE FUNCTION public.bookings_enforce_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg RECORD;
  v_total numeric;
  v_participants integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- never trust client-supplied payment references
    NEW.stripe_payment_intent_id := NULL;
    NEW.stripe_checkout_session_id := NULL;

    IF NEW.package_id IS NOT NULL THEN
      SELECT * INTO pkg FROM public.coach_packages WHERE id = NEW.package_id;
      IF pkg IS NULL THEN
        RAISE EXCEPTION 'Invalid package';
      END IF;
      NEW.coach_id := pkg.coach_id;
      NEW.currency := pkg.currency;

      v_total := pkg.price_per_session;
      IF pkg.pricing_type = 'fixed_total' AND COALESCE(pkg.max_group_size, 1) > 1 THEN
        SELECT count(*) + 1 INTO v_participants
        FROM public.bookings b
        WHERE b.package_id = NEW.package_id
          AND b.booking_date = NEW.booking_date
          AND b.start_time = NEW.start_time
          AND b.status IN ('pending', 'confirmed');
        v_total := pkg.price_per_session / GREATEST(v_participants, 1);
      END IF;

      NEW.total_price := round(v_total, 2);
      NEW.platform_fee := round(NEW.total_price * 0.15, 2);
      NEW.coach_payout := NEW.total_price - NEW.platform_fee;
    ELSE
      -- no package: only admins may set a price
      IF NOT public.has_role(auth.uid(), 'admin') THEN
        NEW.total_price := 0;
        NEW.platform_fee := 0;
        NEW.coach_payout := 0;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  -- UPDATE: preserve financial + identity fields unless admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.total_price := OLD.total_price;
    NEW.platform_fee := OLD.platform_fee;
    NEW.coach_payout := OLD.coach_payout;
    NEW.currency := OLD.currency;
    NEW.stripe_payment_intent_id := OLD.stripe_payment_intent_id;
    NEW.stripe_checkout_session_id := OLD.stripe_checkout_session_id;
    NEW.player_id := OLD.player_id;
    NEW.coach_id := OLD.coach_id;
    NEW.package_id := OLD.package_id;
    NEW.check_in_code := OLD.check_in_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_enforce_pricing_ins ON public.bookings;
CREATE TRIGGER bookings_enforce_pricing_ins
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.bookings_enforce_pricing();

DROP TRIGGER IF EXISTS bookings_enforce_pricing_upd ON public.bookings;
CREATE TRIGGER bookings_enforce_pricing_upd
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.bookings_enforce_pricing();

DROP POLICY IF EXISTS "Players and coaches update bookings" ON public.bookings;
CREATE POLICY "Players and coaches update bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (auth.uid() = player_id OR auth.uid() = coach_id)
WITH CHECK (auth.uid() = player_id OR auth.uid() = coach_id);

DROP POLICY IF EXISTS "Club managers manage club bookings" ON public.bookings;
CREATE POLICY "Club managers manage club bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (club_id IS NOT NULL AND public.is_club_manager(auth.uid(), club_id))
WITH CHECK (club_id IS NOT NULL AND public.is_club_manager(auth.uid(), club_id));

-- 2. EVENT REGISTRATIONS: players may only change status
CREATE OR REPLACE FUNCTION public.event_registrations_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin')
     OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = NEW.event_id AND e.coach_id = auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.event_id := OLD.event_id;
  NEW.player_id := OLD.player_id;
  NEW.payment_status := OLD.payment_status;
  NEW.amount_paid := OLD.amount_paid;
  NEW.registered_at := OLD.registered_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_registrations_guard_upd ON public.event_registrations;
CREATE TRIGGER event_registrations_guard_upd
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.event_registrations_guard();

DROP POLICY IF EXISTS "Players cancel own registrations" ON public.event_registrations;
CREATE POLICY "Players cancel own registrations"
ON public.event_registrations FOR UPDATE TO authenticated
USING (auth.uid() = player_id)
WITH CHECK (auth.uid() = player_id AND status = 'cancelled');

-- 3. CLUB INVITES: invitee may only set accepted_at
CREATE OR REPLACE FUNCTION public.club_invites_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_club_manager(auth.uid(), OLD.club_id) OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.club_id := OLD.club_id;
  NEW.club_role := OLD.club_role;
  NEW.email := OLD.email;
  NEW.token := OLD.token;
  NEW.invited_by := OLD.invited_by;
  NEW.expires_at := OLD.expires_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS club_invites_guard_upd ON public.club_invites;
CREATE TRIGGER club_invites_guard_upd
BEFORE UPDATE ON public.club_invites
FOR EACH ROW EXECUTE FUNCTION public.club_invites_guard();

DROP POLICY IF EXISTS "Invited can accept invite" ON public.club_invites;
CREATE POLICY "Invited can accept invite"
ON public.club_invites FOR UPDATE TO authenticated
USING (email = (SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid()))
WITH CHECK (email = (SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 4. COACH REQUESTS: coaches may only respond
CREATE OR REPLACE FUNCTION public.coach_requests_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.player_id OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.player_id := OLD.player_id;
  NEW.coach_id := OLD.coach_id;
  NEW.block_id := OLD.block_id;
  NEW.package_id := OLD.package_id;
  NEW.request_type := OLD.request_type;
  NEW.message := OLD.message;
  NEW.proposed_start_date := OLD.proposed_start_date;
  NEW.proposed_sessions := OLD.proposed_sessions;
  NEW.coach_has_program_access := OLD.coach_has_program_access;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS coach_requests_guard_upd ON public.coach_requests;
CREATE TRIGGER coach_requests_guard_upd
BEFORE UPDATE ON public.coach_requests
FOR EACH ROW EXECUTE FUNCTION public.coach_requests_guard();

DROP POLICY IF EXISTS "Coaches respond to requests" ON public.coach_requests;
CREATE POLICY "Coaches respond to requests"
ON public.coach_requests FOR UPDATE TO authenticated
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

-- 5. BOOKING PARTICIPANT FEEDBACK: must match a real booking
DROP POLICY IF EXISTS "Coaches manage own feedback" ON public.booking_participant_feedback;
CREATE POLICY "Coaches manage own feedback"
ON public.booking_participant_feedback FOR ALL TO authenticated
USING (
  auth.uid() = coach_id
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_participant_feedback.booking_id
      AND b.coach_id = booking_participant_feedback.coach_id
      AND b.player_id = booking_participant_feedback.player_id
  )
)
WITH CHECK (
  auth.uid() = coach_id
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_participant_feedback.booking_id
      AND b.coach_id = booking_participant_feedback.coach_id
      AND b.player_id = booking_participant_feedback.player_id
  )
);

-- 6. BLOCK PURCHASES: recompute amount from the authoritative block price
CREATE OR REPLACE FUNCTION public.block_purchases_enforce_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  blk RECORD;
BEGIN
  SELECT * INTO blk FROM public.training_blocks WHERE id = NEW.block_id;
  IF blk IS NULL THEN
    RAISE EXCEPTION 'Invalid program';
  END IF;

  NEW.stripe_payment_intent_id := NULL;
  NEW.seller_id := COALESCE(blk.author_id, blk.coach_id);
  NEW.currency := COALESCE(blk.currency, 'EUR');

  IF COALESCE(blk.is_for_sale, false) AND COALESCE(blk.price, 0) > 0 THEN
    NEW.amount_paid := blk.price;
  ELSE
    NEW.amount_paid := 0;
  END IF;
  NEW.platform_fee := round(NEW.amount_paid * 0.15, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_purchases_enforce_pricing_ins ON public.block_purchases;
CREATE TRIGGER block_purchases_enforce_pricing_ins
BEFORE INSERT ON public.block_purchases
FOR EACH ROW EXECUTE FUNCTION public.block_purchases_enforce_pricing();