
-- Add primary_sport to coach_profiles
ALTER TABLE public.coach_profiles
ADD COLUMN IF NOT EXISTS primary_sport text DEFAULT NULL;

-- Add sport tag to modules (padel, tennis, or both)
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS sport text NOT NULL DEFAULT 'both';

-- Add tennis_drill to module_category enum
ALTER TYPE public.module_category ADD VALUE IF NOT EXISTS 'tennis_drill';
