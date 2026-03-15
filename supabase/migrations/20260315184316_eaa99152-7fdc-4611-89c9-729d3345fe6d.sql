
CREATE TABLE public.founder_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.founder_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage spend" ON public.founder_spend
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL,
  reference_id text,
  viewer_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone inserts page view" ON public.page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins read all views" ON public.page_views
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.founder_share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  created_by uuid,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.founder_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage share tokens" ON public.founder_share_tokens
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
