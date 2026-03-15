
CREATE OR REPLACE FUNCTION update_coach_hourly_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.coach_profiles
  SET hourly_rate_from = (
    SELECT MIN(price_per_session)
    FROM public.coach_packages
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
    AND is_active = true
  )
  WHERE user_id = COALESCE(NEW.coach_id, OLD.coach_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_coach_session_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.coach_profiles
  SET total_sessions_coached = (
    SELECT COUNT(*)
    FROM public.player_day_plans
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
  )
  WHERE user_id = COALESCE(NEW.coach_id, OLD.coach_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
