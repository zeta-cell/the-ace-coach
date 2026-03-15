-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'clinic',
  sport text NOT NULL DEFAULT 'both',
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  location_name text,
  location_address text,
  location_city text,
  location_country text,
  is_online boolean DEFAULT false,
  max_participants integer,
  current_participants integer DEFAULT 0,
  price_per_person numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  age_group text DEFAULT 'all',
  skill_level text DEFAULT 'all',
  cover_image_url text,
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published events" ON public.events
  FOR SELECT USING (status IN ('published', 'full', 'completed'));

CREATE POLICY "Coaches manage own events" ON public.events
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins manage all events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Event registrations table
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  status text DEFAULT 'registered',
  payment_status text DEFAULT 'pending',
  amount_paid numeric DEFAULT 0,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(event_id, player_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players see own registrations" ON public.event_registrations
  FOR SELECT TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Players register for events" ON public.event_registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players cancel own registrations" ON public.event_registrations
  FOR UPDATE TO authenticated USING (auth.uid() = player_id);

CREATE POLICY "Coaches see registrations for their events" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id AND coach_id = auth.uid()
  ));

CREATE POLICY "Admins manage all registrations" ON public.event_registrations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for participant count
CREATE OR REPLACE FUNCTION public.update_event_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'registered' THEN
    UPDATE public.events SET current_participants = current_participants + 1,
      status = CASE WHEN current_participants + 1 >= max_participants 
                    AND max_participants IS NOT NULL THEN 'full' 
               ELSE status END
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'registered' 
        AND NEW.status = 'cancelled' THEN
    UPDATE public.events SET current_participants = GREATEST(current_participants - 1, 0),
      status = CASE WHEN status = 'full' THEN 'published' ELSE status END
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_event_participants
AFTER INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_event_participants();

-- Seed example events
DO $$
DECLARE
  coach_uid uuid;
BEGIN
  SELECT user_id INTO coach_uid FROM public.coach_profiles 
  WHERE profile_slug IS NOT NULL LIMIT 1;
  
  IF coach_uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.events) THEN
    INSERT INTO public.events 
      (coach_id, title, description, event_type, sport, 
       start_datetime, end_datetime, location_name, location_city, 
       location_country, max_participants, price_per_person, 
       currency, skill_level, age_group, status) 
    VALUES
    (coach_uid, 'Padel Fundamentals Clinic', 
     'Learn the essential shots and positioning for padel. Perfect for beginners ready to level up.',
     'clinic', 'padel',
     now() + interval '5 days', now() + interval '5 days' + interval '3 hours',
     'Central Sports Club', 'London', 'UK', 12, 35, 'GBP', 'beginner', 'adult', 'published'),
    (coach_uid, 'Advanced Tennis Tactics Camp',
     'A 2-day intensive camp covering serve strategy, return patterns and mental game.',
     'camp', 'tennis',
     now() + interval '14 days', now() + interval '16 days',
     'Royal Tennis Academy', 'Berlin', 'Germany', 8, 180, 'EUR', 'advanced', 'adult', 'published'),
    (coach_uid, 'Kids Padel Introduction',
     'Fun and engaging padel sessions for children aged 8-14. All equipment provided.',
     'group_session', 'padel',
     now() + interval '3 days', now() + interval '3 days' + interval '1 hour 30 minutes',
     'City Padel Center', 'Madrid', 'Spain', 16, 20, 'EUR', 'beginner', 'kids', 'published'),
    (coach_uid, 'Mental Game Masterclass',
     'Elite mental performance coaching for competitive players. Learn pressure management and focus techniques.',
     'masterclass', 'both',
     now() + interval '10 days', now() + interval '10 days' + interval '2 hours',
     NULL, NULL, NULL, 50, 0, 'EUR', 'intermediate', 'adult', 'published'),
    (coach_uid, 'Weekly Group Training',
     'Join our regular group training sessions. Mixed levels welcome. Great for meeting other players.',
     'group_session', 'both',
     now() + interval '2 days', now() + interval '2 days' + interval '2 hours',
     'Community Sports Hall', 'Paris', 'France', 10, 25, 'EUR', 'all', 'all', 'published');
    
    UPDATE public.events SET is_online = true, location_name = 'Zoom',
      location_city = 'Online' WHERE title = 'Mental Game Masterclass';
  END IF;
END $$;