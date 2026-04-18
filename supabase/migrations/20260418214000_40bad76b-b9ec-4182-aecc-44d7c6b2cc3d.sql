-- Phase 1: Session logistics columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS court_number text,
  ADD COLUMN IF NOT EXISTS arrival_instructions text,
  ADD COLUMN IF NOT EXISTS check_in_code text,
  ADD COLUMN IF NOT EXISTS coach_name_for_arrival text;

ALTER TABLE public.player_day_plans
  ADD COLUMN IF NOT EXISTS court_number text,
  ADD COLUMN IF NOT EXISTS arrival_instructions text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS court_number text,
  ADD COLUMN IF NOT EXISTS arrival_instructions text;

-- Phase 2: Module descriptions for both sides
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS player_description text,
  ADD COLUMN IF NOT EXISTS coach_description text;

-- Auto-generate check-in code on new bookings
CREATE OR REPLACE FUNCTION public.generate_check_in_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.check_in_code IS NULL THEN
    NEW.check_in_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_booking_check_in_code ON public.bookings;
CREATE TRIGGER set_booking_check_in_code
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_check_in_code();

-- Backfill existing bookings with codes
UPDATE public.bookings
SET check_in_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6))
WHERE check_in_code IS NULL;