
-- Fix 1: Streak tracking function
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
  last_date date;
  today_date date := CURRENT_DATE;
  current_streak integer;
  longest integer;
BEGIN
  SELECT current_streak_days, longest_streak_days
  INTO current_streak, longest
  FROM public.user_stats WHERE user_id = p_user_id;

  SELECT MAX(plan_date::date) INTO last_date
  FROM public.player_day_plans
  WHERE player_id = p_user_id
  AND plan_date::date < today_date;

  IF last_date = today_date - INTERVAL '1 day' THEN
    current_streak := COALESCE(current_streak, 0) + 1;
  ELSIF last_date < today_date - INTERVAL '1 day' OR last_date IS NULL THEN
    current_streak := 1;
  END IF;

  IF current_streak > COALESCE(longest, 0) THEN
    longest := current_streak;
  END IF;

  UPDATE public.user_stats
  SET current_streak_days = current_streak,
      longest_streak_days = longest,
      updated_at = now()
  WHERE user_id = p_user_id;

  UPDATE public.leaderboard
  SET current_streak_days = current_streak
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 5: Atomic raffle ticket increment
CREATE OR REPLACE FUNCTION public.increment_raffle_tickets(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, raffle_tickets)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET raffle_tickets = user_stats.raffle_tickets + 1,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 6: Recalculate global rankings
CREATE OR REPLACE FUNCTION public.recalculate_rankings()
RETURNS void AS $$
BEGIN
  UPDATE public.leaderboard l
  SET rank_global = r.rank
  FROM (
    SELECT user_id,
           ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
    FROM public.leaderboard
  ) r
  WHERE l.user_id = r.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 6: Update award_xp to recalculate rankings
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_amount integer, p_event_type text, p_description text DEFAULT NULL, p_reference_id uuid DEFAULT NULL)
RETURNS void AS $$
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

  PERFORM public.recalculate_rankings();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
