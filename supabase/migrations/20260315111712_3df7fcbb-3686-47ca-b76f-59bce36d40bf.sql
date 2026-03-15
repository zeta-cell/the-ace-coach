
-- 1. Add marketplace columns to training_blocks
ALTER TABLE public.training_blocks
  ADD COLUMN IF NOT EXISTS author_id uuid,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_avatar_url text,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_for_sale boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS block_type text DEFAULT 'session',
  ADD COLUMN IF NOT EXISTS week_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS times_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_avg numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS preview_exercises jsonb,
  ADD COLUMN IF NOT EXISTS weekly_structure jsonb,
  ADD COLUMN IF NOT EXISTS target_level text,
  ADD COLUMN IF NOT EXISTS target_sport text DEFAULT 'both';

-- 2. Block saves / wishlist
CREATE TABLE IF NOT EXISTS public.block_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES training_blocks(id) ON DELETE CASCADE,
  saved_by uuid NOT NULL,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(block_id, saved_by)
);
ALTER TABLE public.block_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saves" ON public.block_saves
  FOR ALL TO authenticated USING (auth.uid() = saved_by)
  WITH CHECK (auth.uid() = saved_by);
CREATE POLICY "Anyone reads save counts" ON public.block_saves
  FOR SELECT USING (true);

-- 3. Block purchases
CREATE TABLE IF NOT EXISTS public.block_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES training_blocks(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',
  platform_fee numeric DEFAULT 0,
  stripe_payment_intent_id text,
  status text DEFAULT 'completed',
  purchased_at timestamptz DEFAULT now(),
  current_week integer DEFAULT 1,
  UNIQUE(block_id, buyer_id)
);
ALTER TABLE public.block_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers see own purchases" ON public.block_purchases
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers see own sales" ON public.block_purchases
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "Authenticated can insert purchase" ON public.block_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- 4. Block ratings
CREATE TABLE IF NOT EXISTS public.block_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES training_blocks(id) ON DELETE CASCADE,
  rated_by uuid NOT NULL,
  rating integer,
  review_text text,
  rated_at timestamptz DEFAULT now(),
  UNIQUE(block_id, rated_by)
);
ALTER TABLE public.block_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads block ratings" ON public.block_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users rate blocks" ON public.block_ratings
  FOR ALL TO authenticated USING (auth.uid() = rated_by)
  WITH CHECK (auth.uid() = rated_by);

-- 5. Coach assignment requests
CREATE TABLE IF NOT EXISTS public.coach_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  block_id uuid REFERENCES training_blocks(id),
  request_type text DEFAULT 'guide_program',
  message text,
  status text DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coach_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players manage own requests" ON public.coach_requests
  FOR ALL TO authenticated USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Coaches see requests for them" ON public.coach_requests
  FOR SELECT TO authenticated USING (auth.uid() = coach_id);
CREATE POLICY "Coaches respond to requests" ON public.coach_requests
  FOR UPDATE TO authenticated USING (auth.uid() = coach_id);

-- 6. RLS update on training_blocks for public visibility
DROP POLICY IF EXISTS "Coaches read system + own blocks" ON public.training_blocks;
DROP POLICY IF EXISTS "Read training blocks" ON public.training_blocks;
CREATE POLICY "Read training blocks" ON public.training_blocks
  FOR SELECT USING (
    is_system = true 
    OR is_public = true 
    OR auth.uid() = coach_id
  );

-- 7. Increment usage function
CREATE OR REPLACE FUNCTION increment_block_usage(p_block_id uuid)
RETURNS void AS $$
  UPDATE training_blocks SET times_used = COALESCE(times_used, 0) + 1 WHERE id = p_block_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 8. Update rating avg function
CREATE OR REPLACE FUNCTION update_block_rating_avg(p_block_id uuid)
RETURNS void AS $$
  UPDATE training_blocks
  SET 
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM block_ratings WHERE block_id = p_block_id),
    rating_count = (SELECT COUNT(*) FROM block_ratings WHERE block_id = p_block_id)
  WHERE id = p_block_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
