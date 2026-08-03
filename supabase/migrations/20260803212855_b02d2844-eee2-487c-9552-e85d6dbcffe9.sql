CREATE TABLE public.club_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  country text,
  notes text,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.club_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_locations TO authenticated;
GRANT ALL ON public.club_locations TO service_role;

ALTER TABLE public.club_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active club locations"
  ON public.club_locations FOR SELECT
  USING (is_active = true AND EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_locations.club_id AND c.is_active = true));

CREATE POLICY "Managers manage club locations"
  ON public.club_locations FOR ALL
  TO authenticated
  USING (public.is_club_manager(auth.uid(), club_id))
  WITH CHECK (public.is_club_manager(auth.uid(), club_id));

CREATE POLICY "Admins manage all club locations"
  ON public.club_locations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX club_locations_club_id_idx ON public.club_locations(club_id);

CREATE TRIGGER update_club_locations_updated_at
  BEFORE UPDATE ON public.club_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Academy managers may edit their coaches' availability, not just read it
CREATE POLICY "Club managers manage club availability"
  ON public.coach_availability_slots FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.club_coaches cc
    WHERE cc.coach_id = coach_availability_slots.coach_id
      AND public.is_club_manager(auth.uid(), cc.club_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_coaches cc
    WHERE cc.coach_id = coach_availability_slots.coach_id
      AND public.is_club_manager(auth.uid(), cc.club_id)
  ));

-- Academy managers may manage trainings/camps/events of their roster coaches
CREATE POLICY "Club managers manage roster coach events"
  ON public.events FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.club_coaches cc
    WHERE cc.coach_id = events.coach_id
      AND public.is_club_manager(auth.uid(), cc.club_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_coaches cc
    WHERE cc.coach_id = events.coach_id
      AND public.is_club_manager(auth.uid(), cc.club_id)
  ));