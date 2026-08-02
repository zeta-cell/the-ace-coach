-- 1) FEATURE FLAGS
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_enabled boolean NOT NULL DEFAULT true,
  coming_soon boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.feature_flags TO anon;
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT USING (true);

CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT UPDATE, INSERT, DELETE ON public.feature_flags TO authenticated;

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.feature_flags (key, label, description, category, is_enabled, coming_soon) VALUES
  ('marketplace',        'Marketplace',            'Public program marketplace for players and coaches', 'discovery', false, false),
  ('coach_discovery',    'Find a Coach',           'Browse and search all coaches', 'discovery', false, false),
  ('community',          'Community & Leaderboard','Global leaderboard, achievements feed', 'social', false, false),
  ('events',             'Events',                 'Clinics, camps and tournaments', 'training', true, false),
  ('player_videos',      'Video Feedback',         'Player video uploads and coach review', 'training', false, false),
  ('messaging',          'Messaging',              'Player <-> coach chat', 'core', true, false),
  ('assessments',        'Assessments',            'Coach assessments and player development matrix', 'core', true, true),
  ('player_card',        'Player Card',            'Collectible cosmic player card', 'core', true, false),
  ('rewards_discounts',  'Rewards & Discounts',    'Partner discounts and raffles', 'rewards', false, true),
  ('referrals',          'Refer & Earn',           'Referral program and wallet credit', 'rewards', true, false),
  ('connected_devices',  'Connected Devices',      'Whoop, Garmin, Oura, Polar health sync', 'integrations', false, true),
  ('bookings',           'Session Booking',        'Book paid sessions with a coach', 'training', false, false),
  ('coach_earnings',     'Coach Earnings',         'Coach payout dashboard', 'coach', false, false),
  ('coach_crm',          'Coach CRM',              'Coach client pipeline', 'coach', false, false),
  ('coach_marketplace',  'Coach Marketplace',      'Coach selling programs', 'coach', false, false);

-- 2) PLAYER ASSESSMENTS
CREATE TABLE public.player_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  sport text NOT NULL DEFAULT 'padel',
  volley_pct integer NOT NULL DEFAULT 0,
  forehand_pct integer NOT NULL DEFAULT 0,
  serve_pct integer NOT NULL DEFAULT 0,
  smash_pct integer NOT NULL DEFAULT 0,
  backhand_pct integer NOT NULL DEFAULT 0,
  lob_pct integer NOT NULL DEFAULT 0,
  overall_level numeric,
  level_system text DEFAULT 'playtomic',
  summary text,
  strengths text,
  focus_areas text,
  next_goals text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_assessments_player ON public.player_assessments (player_id, assessment_date DESC);
CREATE INDEX idx_player_assessments_coach ON public.player_assessments (coach_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_assessments TO authenticated;
GRANT ALL ON public.player_assessments TO service_role;

ALTER TABLE public.player_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their own assessments"
  ON public.player_assessments FOR SELECT TO authenticated
  USING (auth.uid() = player_id OR auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can create assessments"
  ON public.player_assessments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = coach_id
    AND (public.has_role(auth.uid(), 'coach') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Coaches can update their own assessments"
  ON public.player_assessments FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can delete their own assessments"
  ON public.player_assessments FOR DELETE TO authenticated
  USING (auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_player_assessments_updated_at
  BEFORE UPDATE ON public.player_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();