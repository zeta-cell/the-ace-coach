
ALTER TABLE public.coach_requests
  ADD COLUMN IF NOT EXISTS package_id uuid,
  ADD COLUMN IF NOT EXISTS proposed_start_date date,
  ADD COLUMN IF NOT EXISTS proposed_sessions integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS coach_has_program_access boolean DEFAULT true;

-- Update training_blocks RLS for assigned coaches
DROP POLICY IF EXISTS "Read training blocks" ON public.training_blocks;
CREATE POLICY "Read training blocks" ON public.training_blocks
  FOR SELECT USING (
    is_system = true 
    OR is_public = true 
    OR auth.uid() = coach_id
    OR EXISTS (
      SELECT 1 FROM coach_requests cr
      WHERE cr.block_id = training_blocks.id
      AND cr.coach_id = auth.uid()
      AND cr.status = 'accepted'
    )
  );
