
-- Add coach_video_url to modules
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS coach_video_url text;

-- Add auto_confirm to coach_packages
ALTER TABLE public.coach_packages ADD COLUMN IF NOT EXISTS auto_confirm boolean DEFAULT false;

-- Create video_comments table
CREATE TABLE IF NOT EXISTS public.video_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.progress_videos(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors manage own comments" ON public.video_comments
  FOR ALL TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Players see comments on their videos" ON public.video_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.progress_videos
    WHERE id = video_id AND player_id = auth.uid()
  ));

CREATE POLICY "Admins manage all comments" ON public.video_comments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create coach-videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('coach-videos', 'coach-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for coach-videos
CREATE POLICY "Coaches upload videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'coach-videos' AND public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Authenticated read coach videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'coach-videos');
