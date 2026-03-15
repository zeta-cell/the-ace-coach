
CREATE TABLE IF NOT EXISTS public.booking_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  package_id uuid NOT NULL REFERENCES coach_packages(id),
  requested_date date NOT NULL,
  status text DEFAULT 'waiting',
  notified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, package_id, requested_date)
);

ALTER TABLE public.booking_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players manage own waitlist"
  ON public.booking_waitlist FOR ALL TO authenticated
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Coaches see their waitlist"
  ON public.booking_waitlist FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

ALTER TABLE public.coach_packages
  ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'per_person';
