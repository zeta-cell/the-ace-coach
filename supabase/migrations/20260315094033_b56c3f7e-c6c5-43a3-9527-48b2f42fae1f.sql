
-- Create enums for session_type and sport
CREATE TYPE public.session_type AS ENUM ('individual', 'group', 'kids', 'online');
CREATE TYPE public.sport_type AS ENUM ('tennis', 'padel', 'both');
CREATE TYPE public.badge_level AS ENUM ('starter', 'pro', 'elite', 'legend');

-- Create coach_packages table
CREATE TABLE public.coach_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  title text NOT NULL,
  session_type session_type NOT NULL DEFAULT 'individual',
  sport sport_type NOT NULL DEFAULT 'padel',
  duration_minutes integer NOT NULL DEFAULT 60,
  price_per_session numeric NOT NULL DEFAULT 0,
  total_sessions integer,
  currency text NOT NULL DEFAULT 'EUR',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  max_group_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_packages ENABLE ROW LEVEL SECURITY;

-- RLS: coaches can manage own packages
CREATE POLICY "Coaches can read own packages" ON public.coach_packages
  FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert own packages" ON public.coach_packages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update own packages" ON public.coach_packages
  FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own packages" ON public.coach_packages
  FOR DELETE TO authenticated
  USING (auth.uid() = coach_id);

-- RLS: anyone authenticated can read active packages (for marketplace)
CREATE POLICY "Anyone can read active packages" ON public.coach_packages
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Admins can manage all
CREATE POLICY "Admins can manage all packages" ON public.coach_packages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add new columns to coach_profiles
ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS location_lat numeric,
  ADD COLUMN IF NOT EXISTS location_lng numeric,
  ADD COLUMN IF NOT EXISTS hourly_rate_from numeric,
  ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badge_level badge_level NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS total_sessions_coached integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time_hours integer NOT NULL DEFAULT 24;
