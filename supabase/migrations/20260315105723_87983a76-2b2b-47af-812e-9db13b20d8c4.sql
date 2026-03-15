
CREATE TABLE public.training_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid,
  title text NOT NULL,
  description text,
  goal text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  module_ids uuid[] NOT NULL DEFAULT '{}',
  module_durations integer[] NOT NULL DEFAULT '{}',
  module_notes text[] NOT NULL DEFAULT '{}',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.training_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system blocks" ON public.training_blocks
  FOR SELECT USING (is_system = true);

CREATE POLICY "Coaches can manage own blocks" ON public.training_blocks
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins can manage all blocks" ON public.training_blocks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
