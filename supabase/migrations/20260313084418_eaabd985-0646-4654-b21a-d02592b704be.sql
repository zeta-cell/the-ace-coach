-- Allow coaches to self-assign players
CREATE POLICY "Coaches can insert own assignments"
  ON public.coach_player_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

-- Add trigger for compute_best_weakest_shot (function exists but trigger is missing)
DROP TRIGGER IF EXISTS trg_compute_shots ON public.player_profiles;
CREATE TRIGGER trg_compute_shots
  BEFORE INSERT OR UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION public.compute_best_weakest_shot();