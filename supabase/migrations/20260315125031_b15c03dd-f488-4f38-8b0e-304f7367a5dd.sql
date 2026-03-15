
CREATE TABLE public.health_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  provider_user_id text,
  is_connected boolean DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.health_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health connections" 
  ON public.health_connections FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.health_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  date date NOT NULL,
  recovery_score integer,
  strain_score numeric,
  sleep_score integer,
  sleep_hours numeric,
  hrv_ms integer,
  resting_hr integer,
  steps integer,
  calories_active integer,
  readiness_score integer,
  raw_data jsonb,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, date)
);

ALTER TABLE public.health_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health data" 
  ON public.health_data FOR ALL TO authenticated 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS avg_recovery_score integer,
  ADD COLUMN IF NOT EXISTS avg_hrv integer,
  ADD COLUMN IF NOT EXISTS avg_sleep_hours numeric,
  ADD COLUMN IF NOT EXISTS total_steps integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_calories integer DEFAULT 0;
