
-- Add unique constraint for coach-player pair to support upserts
ALTER TABLE public.coach_player_assignments 
  ADD CONSTRAINT coach_player_unique UNIQUE (coach_id, player_id);
