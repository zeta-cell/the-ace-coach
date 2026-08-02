ALTER TABLE public.player_assessments
  ADD COLUMN IF NOT EXISTS bandeja_pct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vibora_pct integer NOT NULL DEFAULT 0;