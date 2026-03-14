-- Allow admins to insert profiles (for edge cases)
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage all payments
-- (already exists per schema, skip if exists)

-- Allow admins to delete assignments for reassignment
CREATE POLICY "Admins can delete assignments"
  ON public.coach_player_assignments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to get admin stats
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'total_coaches', (SELECT count(*) FROM user_roles WHERE role = 'coach'),
    'total_players', (SELECT count(*) FROM user_roles WHERE role = 'player'),
    'total_modules', (SELECT count(*) FROM modules),
    'total_videos', (SELECT count(*) FROM progress_videos),
    'total_plans', (SELECT count(*) FROM player_day_plans),
    'total_payments', (SELECT count(*) FROM payments),
    'total_revenue', (SELECT COALESCE(sum(amount), 0) FROM payments WHERE status = 'completed'),
    'registrations_by_month', (
      SELECT json_agg(row_to_json(r))
      FROM (
        SELECT to_char(created_at, 'YYYY-MM') as month, count(*) as count
        FROM profiles
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY month
        LIMIT 12
      ) r
    ),
    'revenue_by_month', (
      SELECT json_agg(row_to_json(r))
      FROM (
        SELECT to_char(created_at, 'YYYY-MM') as month,
               type,
               sum(amount) as total
        FROM payments
        WHERE status = 'completed'
        GROUP BY to_char(created_at, 'YYYY-MM'), type
        ORDER BY month
        LIMIT 60
      ) r
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Function for admin to list all users with roles
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_active BOOLEAN,
  onboarding_completed BOOLEAN,
  created_at TIMESTAMPTZ,
  role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.full_name, p.email, p.avatar_url, p.is_active,
         p.onboarding_completed, p.created_at, ur.role
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;