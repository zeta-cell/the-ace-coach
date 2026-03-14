-- Add notification_preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb 
DEFAULT '{"new_message": true, "coach_feedback": true, "new_plan": true, "plan_reminder": true}'::jsonb;

-- Create RLS policies for storage: progress-videos bucket
CREATE POLICY "Players can upload own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'progress-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Players can read own videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'progress-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can read assigned player videos storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'progress-videos' 
  AND EXISTS (
    SELECT 1 FROM public.coach_player_assignments
    WHERE coach_id = auth.uid() 
    AND player_id::text = (storage.foldername(name))[1]
  )
);