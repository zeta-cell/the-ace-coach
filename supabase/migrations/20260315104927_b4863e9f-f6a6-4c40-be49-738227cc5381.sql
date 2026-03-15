
CREATE TABLE public.coach_availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_recurring boolean DEFAULT true,
  specific_date date,
  is_blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read availability" ON public.coach_availability_slots
  FOR SELECT USING (true);

CREATE POLICY "Coaches manage own availability" ON public.coach_availability_slots
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);
