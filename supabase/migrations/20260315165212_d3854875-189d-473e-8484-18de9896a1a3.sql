CREATE OR REPLACE FUNCTION public.increment_session_stats(
  p_user_id uuid,
  p_minutes integer DEFAULT 0
) RETURNS void AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, total_sessions, total_minutes)
  VALUES (p_user_id, 1, p_minutes)
  ON CONFLICT (user_id) DO UPDATE
  SET total_sessions = user_stats.total_sessions + 1,
      total_minutes = user_stats.total_minutes + p_minutes,
      total_calories = user_stats.total_calories + (p_minutes * 8),
      updated_at = now();

  UPDATE public.leaderboard
  SET total_sessions = (
    SELECT total_sessions FROM public.user_stats 
    WHERE user_id = p_user_id
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;