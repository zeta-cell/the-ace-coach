-- CRM Clients
CREATE TABLE public.crm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('coach', 'club')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  pipeline_stage TEXT NOT NULL DEFAULT 'lead',
  lifetime_value NUMERIC NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  linked_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_clients_owner ON public.crm_clients(owner_id, owner_type);
CREATE INDEX idx_crm_clients_stage ON public.crm_clients(pipeline_stage);
CREATE INDEX idx_crm_clients_email ON public.crm_clients(email);

ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach owners manage own clients"
  ON public.crm_clients FOR ALL
  USING (owner_type = 'coach' AND auth.uid() = owner_id)
  WITH CHECK (owner_type = 'coach' AND auth.uid() = owner_id);

CREATE POLICY "Club managers manage club clients"
  ON public.crm_clients FOR ALL
  USING (owner_type = 'club' AND public.is_club_manager(auth.uid(), owner_id))
  WITH CHECK (owner_type = 'club' AND public.is_club_manager(auth.uid(), owner_id));

CREATE POLICY "Admins manage all crm clients"
  ON public.crm_clients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER crm_clients_updated_at
  BEFORE UPDATE ON public.crm_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRM Activities
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.crm_clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note',
  body TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_activities_client ON public.crm_activities(client_id, created_at DESC);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity access via client ownership"
  ON public.crm_activities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.crm_clients c
    WHERE c.id = crm_activities.client_id
    AND (
      (c.owner_type = 'coach' AND c.owner_id = auth.uid())
      OR (c.owner_type = 'club' AND public.is_club_manager(auth.uid(), c.owner_id))
      OR public.has_role(auth.uid(), 'admin')
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_clients c
    WHERE c.id = crm_activities.client_id
    AND (
      (c.owner_type = 'coach' AND c.owner_id = auth.uid())
      OR (c.owner_type = 'club' AND public.is_club_manager(auth.uid(), c.owner_id))
      OR public.has_role(auth.uid(), 'admin')
    )
  ));

-- CRM Pipeline Stages (customizable kanban columns)
CREATE TABLE public.crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('coach', 'club')),
  name TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT 'hsl(var(--primary))',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, owner_type, stage_key)
);

CREATE INDEX idx_crm_stages_owner ON public.crm_pipeline_stages(owner_id, owner_type, order_index);

ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach owners manage own stages"
  ON public.crm_pipeline_stages FOR ALL
  USING (owner_type = 'coach' AND auth.uid() = owner_id)
  WITH CHECK (owner_type = 'coach' AND auth.uid() = owner_id);

CREATE POLICY "Club managers manage club stages"
  ON public.crm_pipeline_stages FOR ALL
  USING (owner_type = 'club' AND public.is_club_manager(auth.uid(), owner_id))
  WITH CHECK (owner_type = 'club' AND public.is_club_manager(auth.uid(), owner_id));

CREATE POLICY "Admins manage all crm stages"
  ON public.crm_pipeline_stages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Helper: seed default stages for a new owner
CREATE OR REPLACE FUNCTION public.seed_default_crm_stages(_owner_id UUID, _owner_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.crm_pipeline_stages (owner_id, owner_type, name, stage_key, order_index, color) VALUES
    (_owner_id, _owner_type, 'Lead', 'lead', 0, 'hsl(220 14% 60%)'),
    (_owner_id, _owner_type, 'Contacted', 'contacted', 1, 'hsl(199 89% 48%)'),
    (_owner_id, _owner_type, 'Trial Booked', 'trial', 2, 'hsl(38 92% 50%)'),
    (_owner_id, _owner_type, 'Active Client', 'active', 3, 'hsl(142 71% 45%)'),
    (_owner_id, _owner_type, 'Churned', 'churned', 4, 'hsl(0 84% 60%)')
  ON CONFLICT (owner_id, owner_type, stage_key) DO NOTHING;
END;
$$;

-- Auto-create CRM client on first booking from a new player (per coach)
CREATE OR REPLACE FUNCTION public.auto_create_crm_client_from_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  player_email TEXT;
  player_name TEXT;
  existing_id UUID;
BEGIN
  SELECT email, full_name INTO player_email, player_name
  FROM public.profiles WHERE user_id = NEW.player_id;

  IF player_email IS NULL THEN RETURN NEW; END IF;

  SELECT id INTO existing_id FROM public.crm_clients
  WHERE owner_id = NEW.coach_id AND owner_type = 'coach' AND email = player_email
  LIMIT 1;

  IF existing_id IS NULL THEN
    INSERT INTO public.crm_clients (owner_id, owner_type, full_name, email, source, pipeline_stage, linked_user_id, last_contact_at)
    VALUES (NEW.coach_id, 'coach', COALESCE(player_name, player_email), player_email, 'booking', 'active', NEW.player_id, now());
  ELSE
    UPDATE public.crm_clients
    SET linked_user_id = COALESCE(linked_user_id, NEW.player_id),
        last_contact_at = now(),
        pipeline_stage = CASE WHEN pipeline_stage IN ('lead','contacted','trial') THEN 'active' ELSE pipeline_stage END
    WHERE id = existing_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_to_crm
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_crm_client_from_booking();