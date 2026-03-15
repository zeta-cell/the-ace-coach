ALTER TABLE public.player_day_plan_items
  ADD COLUMN IF NOT EXISTS block_id uuid
  REFERENCES public.training_blocks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plan_items_block_id
  ON public.player_day_plan_items(block_id);