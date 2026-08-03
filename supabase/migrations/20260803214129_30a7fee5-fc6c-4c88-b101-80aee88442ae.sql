-- 1. ACADEMIES (owned by a club, max one per club)
CREATE TABLE public.academies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL UNIQUE REFERENCES public.clubs(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  description text,
  address text,
  city text,
  country text,
  contact_email text,
  contact_phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academies TO authenticated;
GRANT SELECT ON public.academies TO anon;
GRANT ALL ON public.academies TO service_role;

-- 2. HOST CLUBS (an academy can operate in several clubs)
CREATE TABLE public.academy_clubs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (academy_id, club_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_clubs TO authenticated;
GRANT SELECT ON public.academy_clubs TO anon;
GRANT ALL ON public.academy_clubs TO service_role;

-- 3. ACADEMY ROSTER
CREATE TABLE public.academy_coaches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  academy_role text NOT NULL DEFAULT 'coach',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (academy_id, coach_id),
  CONSTRAINT academy_role_valid CHECK (academy_role IN ('owner', 'manager', 'coach'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_coaches TO authenticated;
GRANT SELECT ON public.academy_coaches TO anon;
GRANT ALL ON public.academy_coaches TO service_role;

-- 4. HELPERS
CREATE OR REPLACE FUNCTION public.is_academy_manager(_user_id uuid, _academy_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academies a
    WHERE a.id = _academy_id
      AND (a.owner_id = _user_id OR public.is_club_manager(_user_id, a.club_id))
  ) OR EXISTS (
    SELECT 1 FROM public.academy_coaches ac
    WHERE ac.academy_id = _academy_id
      AND ac.coach_id = _user_id
      AND ac.academy_role IN ('owner', 'manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_academies(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.academies WHERE owner_id = _user_id
  UNION
  SELECT academy_id FROM public.academy_coaches WHERE coach_id = _user_id
  UNION
  SELECT a.id FROM public.academies a
  JOIN public.club_coaches cc ON cc.club_id = a.club_id AND cc.coach_id = _user_id
  WHERE cc.club_role IN ('owner', 'manager')
$$;

-- Manager of the academy that a given coach belongs to
CREATE OR REPLACE FUNCTION public.manages_academy_coach(_manager_id uuid, _coach_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_coaches ac
    WHERE ac.coach_id = _coach_id
      AND public.is_academy_manager(_manager_id, ac.academy_id)
  )
$$;

-- 5. Only club owners/managers may create an academy; bootstrap roster + host club
CREATE OR REPLACE FUNCTION public.academies_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_club_manager(auth.uid(), NEW.club_id) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Only a club owner or manager can create an academy';
  END IF;
  NEW.owner_id := COALESCE(auth.uid(), NEW.owner_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER academies_before_insert
BEFORE INSERT ON public.academies
FOR EACH ROW EXECUTE FUNCTION public.academies_before_insert();

CREATE OR REPLACE FUNCTION public.academies_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.academy_clubs (academy_id, club_id, is_primary)
  VALUES (NEW.id, NEW.club_id, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.academy_coaches (academy_id, coach_id, academy_role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER academies_after_insert
AFTER INSERT ON public.academies
FOR EACH ROW EXECUTE FUNCTION public.academies_after_insert();

CREATE TRIGGER update_academies_updated_at
BEFORE UPDATE ON public.academies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RLS
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active academies are viewable by everyone"
ON public.academies FOR SELECT
USING (is_active = true OR public.is_academy_manager(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Club managers can create an academy"
ON public.academies FOR INSERT TO authenticated
WITH CHECK (public.is_club_manager(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Academy managers can update their academy"
ON public.academies FOR UPDATE TO authenticated
USING (public.is_academy_manager(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_academy_manager(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Academy owners can delete their academy"
ON public.academies FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_club_manager(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Academy host clubs are viewable by everyone"
ON public.academy_clubs FOR SELECT
USING (true);

CREATE POLICY "Academy managers manage host clubs"
ON public.academy_clubs FOR ALL TO authenticated
USING (public.is_academy_manager(auth.uid(), academy_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_academy_manager(auth.uid(), academy_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Academy coaches are viewable by everyone"
ON public.academy_coaches FOR SELECT
USING (true);

CREATE POLICY "Academy managers manage the roster"
ON public.academy_coaches FOR ALL TO authenticated
USING (public.is_academy_manager(auth.uid(), academy_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_academy_manager(auth.uid(), academy_id) OR public.has_role(auth.uid(), 'admin'));

-- 7. Academy managers can manage roster coaches' events + availability
CREATE POLICY "Academy managers manage roster events"
ON public.events FOR ALL TO authenticated
USING (public.manages_academy_coach(auth.uid(), coach_id))
WITH CHECK (public.manages_academy_coach(auth.uid(), coach_id));

CREATE POLICY "Academy managers manage roster availability"
ON public.coach_availability_slots FOR ALL TO authenticated
USING (public.manages_academy_coach(auth.uid(), coach_id))
WITH CHECK (public.manages_academy_coach(auth.uid(), coach_id));