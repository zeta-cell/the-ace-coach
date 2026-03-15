
CREATE OR REPLACE FUNCTION update_coach_hourly_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coach_profiles
  SET hourly_rate_from = (
    SELECT MIN(price_per_session)
    FROM coach_packages
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
    AND is_active = true
  )
  WHERE user_id = COALESCE(NEW.coach_id, OLD.coach_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_coach_hourly_rate
AFTER INSERT OR UPDATE OR DELETE ON coach_packages
FOR EACH ROW EXECUTE FUNCTION update_coach_hourly_rate();

CREATE OR REPLACE FUNCTION update_coach_session_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coach_profiles
  SET total_sessions_coached = (
    SELECT COUNT(*)
    FROM player_day_plans
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
  )
  WHERE user_id = COALESCE(NEW.coach_id, OLD.coach_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_coach_session_count
AFTER INSERT OR DELETE ON player_day_plans
FOR EACH ROW EXECUTE FUNCTION update_coach_session_count();

UPDATE coach_profiles cp
SET total_sessions_coached = (
  SELECT COUNT(*) FROM player_day_plans WHERE coach_id = cp.user_id
);
