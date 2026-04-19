-- Add club_manager role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'club_manager';

-- Clubs table
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  description TEXT,
  owner_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Club coaches (membership)
CREATE TABLE public.club_coaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  club_role TEXT NOT NULL DEFAULT 'coach' CHECK (club_role IN ('owner', 'manager', 'coach')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (club_id, coach_id)
);

-- Club courts
CREATE TABLE public.club_courts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  court_number TEXT NOT NULL,
  surface TEXT,
  is_indoor BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Club invites
CREATE TABLE public.club_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  invited_by UUID NOT NULL,
  club_role TEXT NOT NULL DEFAULT 'coach' CHECK (club_role IN ('manager', 'coach')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add club + court refs to bookings + events
ALTER TABLE public.bookings ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN court_id UUID REFERENCES public.club_courts(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN court_id UUID REFERENCES public.club_courts(id) ON DELETE SET NULL;

-- Helper functions (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_club_member(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_coaches
    WHERE club_id = _club_id AND coach_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_club_manager(_user_id UUID, _club_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_coaches
    WHERE club_id = _club_id
      AND coach_id = _user_id
      AND club_role IN ('owner', 'manager')
  ) OR EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id = _club_id AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_clubs(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT club_id FROM public.club_coaches WHERE coach_id = _user_id
  UNION
  SELECT id FROM public.clubs WHERE owner_id = _user_id
$$;

-- RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_invites ENABLE ROW LEVEL SECURITY;

-- clubs policies
CREATE POLICY "Public can read active clubs" ON public.clubs FOR SELECT USING (is_active = true);
CREATE POLICY "Owner can manage own club" ON public.clubs FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Managers can update club" ON public.clubs FOR UPDATE USING (public.is_club_manager(auth.uid(), id));
CREATE POLICY "Authenticated can create clubs" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins manage all clubs" ON public.clubs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- club_coaches policies
CREATE POLICY "Public can read club roster" ON public.club_coaches FOR SELECT USING (true);
CREATE POLICY "Managers manage roster" ON public.club_coaches FOR ALL USING (public.is_club_manager(auth.uid(), club_id)) WITH CHECK (public.is_club_manager(auth.uid(), club_id));
CREATE POLICY "Coach can leave own membership" ON public.club_coaches FOR DELETE USING (auth.uid() = coach_id);
CREATE POLICY "Admins manage all club_coaches" ON public.club_coaches FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- club_courts policies
CREATE POLICY "Public can read courts" ON public.club_courts FOR SELECT USING (true);
CREATE POLICY "Managers manage courts" ON public.club_courts FOR ALL USING (public.is_club_manager(auth.uid(), club_id)) WITH CHECK (public.is_club_manager(auth.uid(), club_id));
CREATE POLICY "Admins manage all courts" ON public.club_courts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- club_invites policies
CREATE POLICY "Managers manage invites" ON public.club_invites FOR ALL USING (public.is_club_manager(auth.uid(), club_id)) WITH CHECK (public.is_club_manager(auth.uid(), club_id));
CREATE POLICY "Invited email can read own invite" ON public.club_invites FOR SELECT USING (
  email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Invited can accept invite" ON public.club_invites FOR UPDATE USING (
  email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
);

-- Extend bookings RLS so club managers can see/manage club bookings
CREATE POLICY "Club managers see club bookings" ON public.bookings FOR SELECT USING (
  club_id IS NOT NULL AND public.is_club_manager(auth.uid(), club_id)
);
CREATE POLICY "Club managers manage club bookings" ON public.bookings FOR UPDATE USING (
  club_id IS NOT NULL AND public.is_club_manager(auth.uid(), club_id)
);

-- Extend events RLS for club managers
CREATE POLICY "Club managers manage club events" ON public.events FOR ALL USING (
  club_id IS NOT NULL AND public.is_club_manager(auth.uid(), club_id)
) WITH CHECK (
  club_id IS NOT NULL AND public.is_club_manager(auth.uid(), club_id)
);

-- Extend coach_packages so club managers can read/manage packages of their club's coaches
CREATE POLICY "Club managers read club coach packages" ON public.coach_packages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.club_coaches cc
    WHERE cc.coach_id = coach_packages.coach_id
      AND public.is_club_manager(auth.uid(), cc.club_id)
  )
);

-- Extend availability for club managers
CREATE POLICY "Club managers read club availability" ON public.coach_availability_slots FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.club_coaches cc
    WHERE cc.coach_id = coach_availability_slots.coach_id
      AND public.is_club_manager(auth.uid(), cc.club_id)
  )
);

-- Triggers
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add owner to club_coaches as 'owner' on club insert
CREATE OR REPLACE FUNCTION public.handle_new_club()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.club_coaches (club_id, coach_id, club_role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (club_id, coach_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_club_created
  AFTER INSERT ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_club();

-- Indexes
CREATE INDEX idx_club_coaches_coach ON public.club_coaches(coach_id);
CREATE INDEX idx_club_coaches_club ON public.club_coaches(club_id);
CREATE INDEX idx_club_courts_club ON public.club_courts(club_id);
CREATE INDEX idx_bookings_club ON public.bookings(club_id);
CREATE INDEX idx_events_club ON public.events(club_id);
CREATE INDEX idx_club_invites_email ON public.club_invites(email);
CREATE INDEX idx_club_invites_token ON public.club_invites(token);