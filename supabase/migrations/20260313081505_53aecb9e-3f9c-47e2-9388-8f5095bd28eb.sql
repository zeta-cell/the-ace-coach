
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('player', 'coach', 'admin');
CREATE TYPE public.dominant_hand AS ENUM ('left', 'right');
CREATE TYPE public.fitness_level AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');
CREATE TYPE public.shot_data_source AS ENUM ('player', 'coach');
CREATE TYPE public.racket_type AS ENUM ('power', 'control', 'mixed');
CREATE TYPE public.module_category AS ENUM ('warm_up', 'padel_drill', 'footwork', 'fitness', 'strength', 'mental', 'recovery', 'cool_down', 'nutrition', 'video');
CREATE TYPE public.module_difficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');
CREATE TYPE public.payment_type AS ENUM ('camp', 'monthly', 'annual', 'session', 'other');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- PROFILES TABLE (main user data)
-- =============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES TABLE (separate from profiles per security best practice)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- =============================================
-- PLAYER PROFILES TABLE
-- =============================================
CREATE TABLE public.player_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  nationality TEXT,
  dominant_hand dominant_hand,
  years_playing INT DEFAULT 0,
  playtomic_url TEXT,
  playtomic_level NUMERIC,
  fitness_level fitness_level DEFAULT 'beginner',
  goals TEXT[] DEFAULT '{}',
  injuries TEXT,
  -- Shot confidence 0-100
  volley_pct INT DEFAULT 50,
  forehand_pct INT DEFAULT 50,
  serve_pct INT DEFAULT 50,
  smash_pct INT DEFAULT 50,
  backhand_pct INT DEFAULT 50,
  lob_pct INT DEFAULT 50,
  shot_data_source shot_data_source DEFAULT 'player',
  -- Play style
  left_tendency_pct INT DEFAULT 50,
  right_tendency_pct INT DEFAULT 50,
  -- Auto-derived
  best_shot TEXT,
  weakest_shot TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PLAYER RACKETS TABLE
-- =============================================
CREATE TABLE public.player_rackets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  type racket_type DEFAULT 'mixed',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_rackets ENABLE ROW LEVEL SECURITY;

-- =============================================
-- COACH PROFILES TABLE
-- =============================================
CREATE TABLE public.coach_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  specializations TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  years_experience INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MODULES TABLE (coach training blocks)
-- =============================================
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category module_category NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 15,
  difficulty module_difficulty DEFAULT 'beginner',
  instructions TEXT,
  video_url TEXT,
  equipment TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MODULE EXERCISES TABLE
-- =============================================
CREATE TABLE public.module_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INT,
  reps INT,
  duration_sec INT,
  rest_sec INT DEFAULT 0,
  notes TEXT,
  order_index INT NOT NULL DEFAULT 0
);

ALTER TABLE public.module_exercises ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PLAYER DAY PLANS TABLE
-- =============================================
CREATE TABLE public.player_day_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_day_plans ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PLAYER DAY PLAN ITEMS TABLE
-- =============================================
CREATE TABLE public.player_day_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.player_day_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  coach_note TEXT
);

ALTER TABLE public.player_day_plan_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  type payment_type NOT NULL DEFAULT 'other',
  status payment_status NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROGRESS VIDEOS TABLE
-- =============================================
CREATE TABLE public.progress_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  youtube_url TEXT,
  shot_tag TEXT,
  coach_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_videos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- COACH-PLAYER ASSIGNMENTS
-- =============================================
CREATE TABLE public.coach_player_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, player_id)
);

ALTER TABLE public.coach_player_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_day_plans_updated_at
  BEFORE UPDATE ON public.player_day_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-COMPUTE BEST/WEAKEST SHOT
-- =============================================
CREATE OR REPLACE FUNCTION public.compute_best_weakest_shot()
RETURNS TRIGGER AS $$
DECLARE
  shots JSONB;
  best TEXT;
  worst TEXT;
BEGIN
  shots := jsonb_build_object(
    'Volley', NEW.volley_pct,
    'Forehand', NEW.forehand_pct,
    'Serve', NEW.serve_pct,
    'Smash', NEW.smash_pct,
    'Backhand', NEW.backhand_pct,
    'Lob', NEW.lob_pct
  );
  SELECT key INTO best FROM jsonb_each_text(shots) ORDER BY value::int DESC LIMIT 1;
  SELECT key INTO worst FROM jsonb_each_text(shots) ORDER BY value::int ASC LIMIT 1;
  NEW.best_shot := best;
  NEW.weakest_shot := worst;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER compute_player_shots
  BEFORE INSERT OR UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION public.compute_best_weakest_shot();

-- =============================================
-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'player');
  INSERT INTO public.player_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can read assigned players profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'coach') AND user_id IN (
    SELECT player_id FROM public.coach_player_assignments WHERE coach_id = auth.uid()
  )
);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PLAYER PROFILES
CREATE POLICY "Players can read own player profile" ON public.player_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players can update own player profile" ON public.player_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can read assigned player profiles" ON public.player_profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'coach') AND user_id IN (
    SELECT player_id FROM public.coach_player_assignments WHERE coach_id = auth.uid()
  )
);
CREATE POLICY "Coaches can update assigned player profiles" ON public.player_profiles FOR UPDATE USING (
  public.has_role(auth.uid(), 'coach') AND user_id IN (
    SELECT player_id FROM public.coach_player_assignments WHERE coach_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all player profiles" ON public.player_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PLAYER RACKETS
CREATE POLICY "Players can manage own rackets" ON public.player_rackets FOR ALL USING (auth.uid() = player_id);
CREATE POLICY "Coaches can read assigned player rackets" ON public.player_rackets FOR SELECT USING (
  public.has_role(auth.uid(), 'coach') AND player_id IN (
    SELECT player_id FROM public.coach_player_assignments WHERE coach_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all rackets" ON public.player_rackets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- COACH PROFILES
CREATE POLICY "Coaches can read own profile" ON public.coach_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Coaches can update own profile" ON public.coach_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all coach profiles" ON public.coach_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- MODULES
CREATE POLICY "Anyone authenticated can read shared modules" ON public.modules FOR SELECT USING (is_shared = true);
CREATE POLICY "Coaches can read own modules" ON public.modules FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Coaches can manage own modules" ON public.modules FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all modules" ON public.modules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- MODULE EXERCISES
CREATE POLICY "Anyone can read exercises of accessible modules" ON public.module_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.modules WHERE id = module_id AND (is_shared = true OR created_by = auth.uid()))
);
CREATE POLICY "Coaches can manage exercises of own modules" ON public.module_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM public.modules WHERE id = module_id AND created_by = auth.uid())
);
CREATE POLICY "Admins can manage all exercises" ON public.module_exercises FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PLAYER DAY PLANS
CREATE POLICY "Players can read own plans" ON public.player_day_plans FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Coaches can manage plans for assigned players" ON public.player_day_plans FOR ALL USING (
  auth.uid() = coach_id AND player_id IN (
    SELECT player_id FROM public.coach_player_assignments WHERE coach_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all plans" ON public.player_day_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PLAYER DAY PLAN ITEMS
CREATE POLICY "Players can read own plan items" ON public.player_day_plan_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.player_day_plans WHERE id = plan_id AND player_id = auth.uid())
);
CREATE POLICY "Players can update own plan items" ON public.player_day_plan_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.player_day_plans WHERE id = plan_id AND player_id = auth.uid())
);
CREATE POLICY "Coaches can manage plan items for assigned players" ON public.player_day_plan_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.player_day_plans WHERE id = plan_id AND coach_id = auth.uid())
);
CREATE POLICY "Admins can manage all plan items" ON public.player_day_plan_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- MESSAGES
CREATE POLICY "Users can read own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own sent messages" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- PAYMENTS
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- PROGRESS VIDEOS
CREATE POLICY "Players can manage own videos" ON public.progress_videos FOR ALL USING (auth.uid() = player_id);
CREATE POLICY "Coaches can read assigned player videos" ON public.progress_videos FOR SELECT USING (
  public.has_role(auth.uid(), 'coach') AND player_id IN (
    SELECT player_id FROM public.coach_player_assignments WHERE coach_id = auth.uid()
  )
);
CREATE POLICY "Coaches can update feedback on assigned player videos" ON public.progress_videos FOR UPDATE USING (
  public.has_role(auth.uid(), 'coach') AND player_id IN (
    SELECT player_id FROM public.coach_player_assignments WHERE coach_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all videos" ON public.progress_videos FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- COACH PLAYER ASSIGNMENTS
CREATE POLICY "Coaches can read own assignments" ON public.coach_player_assignments FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Players can read own assignments" ON public.coach_player_assignments FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Admins can manage all assignments" ON public.coach_player_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-videos', 'progress-videos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload progress videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'progress-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can read own progress videos" ON storage.objects FOR SELECT USING (bucket_id = 'progress-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own progress videos" ON storage.objects FOR DELETE USING (bucket_id = 'progress-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can read own attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
