ALTER TABLE public.player_day_plans
ADD COLUMN start_time time without time zone DEFAULT NULL,
ADD COLUMN end_time time without time zone DEFAULT NULL;