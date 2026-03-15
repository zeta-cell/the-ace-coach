
-- Gamification tables

CREATE TABLE public.user_xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  xp_amount integer NOT NULL,
  event_type text NOT NULL,
  reference_id uuid,
  reference_type text,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own XP events" ON public.user_xp_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System inserts XP events" ON public.user_xp_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY,
  total_xp integer DEFAULT 0,
  current_level text DEFAULT 'bronze',
  current_streak_days integer DEFAULT 0,
  longest_streak_days integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  total_minutes integer DEFAULT 0,
  total_coaches integer DEFAULT 0,
  cities_trained_in text[] DEFAULT '{}',
  calories_estimate integer DEFAULT 0,
  raffle_tickets integer DEFAULT 0,
  wallet_balance numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own stats" ON public.user_stats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own stats" ON public.user_stats
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  badge_name text NOT NULL,
  badge_description text,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System grants badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid,
  referral_code text UNIQUE NOT NULL,
  status text DEFAULT 'pending',
  signup_reward_paid boolean DEFAULT false,
  booking_reward_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrers see own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);
CREATE POLICY "Anyone updates referral on signup" ON public.referrals
  FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  description text,
  reference_id uuid,
  balance_after numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.leaderboard (
  user_id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  total_xp integer DEFAULT 0,
  current_level text DEFAULT 'bronze',
  total_sessions integer DEFAULT 0,
  current_streak_days integer DEFAULT 0,
  city text,
  sport text DEFAULT 'both',
  rank_global integer,
  rank_updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads leaderboard" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Users update own entry" ON public.leaderboard
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Add referral_code to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Generate referral codes for existing users
UPDATE public.profiles 
SET referral_code = LOWER(SUBSTRING(MD5(user_id::text), 1, 8))
WHERE referral_code IS NULL;

-- XP award function
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_amount integer,
  p_event_type text,
  p_description text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  new_xp integer;
  new_level text;
BEGIN
  INSERT INTO public.user_xp_events (user_id, xp_amount, event_type, description, reference_id)
  VALUES (p_user_id, p_amount, p_event_type, p_description, p_reference_id);

  INSERT INTO public.user_stats (user_id, total_xp)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET total_xp = user_stats.total_xp + p_amount,
      updated_at = now();

  SELECT total_xp INTO new_xp FROM public.user_stats WHERE user_id = p_user_id;

  new_level := CASE
    WHEN new_xp >= 25000 THEN 'legend'
    WHEN new_xp >= 10000 THEN 'diamond'
    WHEN new_xp >= 4000  THEN 'platinum'
    WHEN new_xp >= 1500  THEN 'gold'
    WHEN new_xp >= 500   THEN 'silver'
    ELSE 'bronze'
  END;

  UPDATE public.user_stats SET current_level = new_level WHERE user_id = p_user_id;

  INSERT INTO public.leaderboard (user_id, total_xp, current_level)
  VALUES (p_user_id, new_xp, new_level)
  ON CONFLICT (user_id) DO UPDATE
  SET total_xp = new_xp, current_level = new_level, rank_updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Wallet credit function
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_type text,
  p_description text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  new_balance numeric;
BEGIN
  INSERT INTO public.user_stats (user_id, wallet_balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET wallet_balance = user_stats.wallet_balance + p_amount, updated_at = now();

  SELECT wallet_balance INTO new_balance FROM public.user_stats WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description, reference_id, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id, new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
