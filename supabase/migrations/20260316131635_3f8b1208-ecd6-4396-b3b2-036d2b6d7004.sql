CREATE TABLE IF NOT EXISTS public.coach_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  name text NOT NULL,
  issuing_body text,
  year_obtained integer,
  certificate_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own certs"
  ON public.coach_certifications FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Anyone can read certs"
  ON public.coach_certifications FOR SELECT TO public
  USING (true);