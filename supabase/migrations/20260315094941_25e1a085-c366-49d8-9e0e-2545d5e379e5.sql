
-- New enums
CREATE TYPE public.preferred_sport AS ENUM ('tennis', 'padel', 'both');
CREATE TYPE public.training_frequency AS ENUM ('daily', '3-4x_week', '1-2x_week', 'occasional');

-- Add columns to player_profiles
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS preferred_sport preferred_sport DEFAULT 'padel',
  ADD COLUMN IF NOT EXISTS favourite_players text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS club_name text,
  ADD COLUMN IF NOT EXISTS club_location text,
  ADD COLUMN IF NOT EXISTS shirt_size text,
  ADD COLUMN IF NOT EXISTS apple_health_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_ranking text,
  ADD COLUMN IF NOT EXISTS plays_since_year integer,
  ADD COLUMN IF NOT EXISTS preferred_court_surface text,
  ADD COLUMN IF NOT EXISTS training_freq training_frequency DEFAULT 'occasional',
  ADD COLUMN IF NOT EXISTS current_usta_ntrp numeric;

-- Add columns to player_rackets
ALTER TABLE public.player_rackets
  ADD COLUMN IF NOT EXISTS string_brand text,
  ADD COLUMN IF NOT EXISTS string_tension text,
  ADD COLUMN IF NOT EXISTS grip_size text;
