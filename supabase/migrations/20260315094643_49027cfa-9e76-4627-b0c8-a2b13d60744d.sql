
-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  player_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public page)
CREATE POLICY "Anyone can read reviews" ON public.reviews
  FOR SELECT USING (true);

-- Authenticated players can insert reviews
CREATE POLICY "Players can insert reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- Players can update own reviews
CREATE POLICY "Players can update own reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = player_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Allow anon users to read coach_profiles for public pages
CREATE POLICY "Public can read coach profiles" ON public.coach_profiles
  FOR SELECT USING (true);

-- Allow anon users to read active coach_packages
DROP POLICY IF EXISTS "Anyone can read active packages" ON public.coach_packages;
CREATE POLICY "Public can read active packages" ON public.coach_packages
  FOR SELECT USING (is_active = true);

-- Allow anon users to read profiles (name/avatar for public coach page)
CREATE POLICY "Public can read basic profiles" ON public.profiles
  FOR SELECT USING (true);
