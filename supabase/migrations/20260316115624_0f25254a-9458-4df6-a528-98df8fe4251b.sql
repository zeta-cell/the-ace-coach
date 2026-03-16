
-- Add min_participants to coach_packages
ALTER TABLE public.coach_packages ADD COLUMN IF NOT EXISTS min_participants integer DEFAULT NULL;

-- Add is_recurring_group and recurring_day_of_week to coach_packages
ALTER TABLE public.coach_packages ADD COLUMN IF NOT EXISTS is_recurring_group boolean DEFAULT false;
ALTER TABLE public.coach_packages ADD COLUMN IF NOT EXISTS recurring_day_of_week integer DEFAULT NULL;
ALTER TABLE public.coach_packages ADD COLUMN IF NOT EXISTS recurring_start_time time DEFAULT NULL;

-- Create booking_participant_feedback table for post-session per-participant feedback
CREATE TABLE IF NOT EXISTS public.booking_participant_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  player_id uuid NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Unique constraint: one feedback per booking
ALTER TABLE public.booking_participant_feedback ADD CONSTRAINT unique_booking_feedback UNIQUE (booking_id);

-- Enable RLS
ALTER TABLE public.booking_participant_feedback ENABLE ROW LEVEL SECURITY;

-- Coaches can manage feedback they created
CREATE POLICY "Coaches manage own feedback" ON public.booking_participant_feedback
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Players can read their own feedback
CREATE POLICY "Players read own feedback" ON public.booking_participant_feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = player_id);
