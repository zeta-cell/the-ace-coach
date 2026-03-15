
-- Add new columns to training_blocks for enhanced training block system
ALTER TABLE public.training_blocks
  ADD COLUMN IF NOT EXISTS sport text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'intermediate',
  ADD COLUMN IF NOT EXISTS goals text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exercises jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;
