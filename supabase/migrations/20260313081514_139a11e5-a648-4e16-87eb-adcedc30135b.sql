
-- Fix overly permissive notifications INSERT policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only authenticated users can receive notifications (inserted by server-side triggers/functions)
-- For now, allow any authenticated user to insert (needed for system notifications via edge functions)
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
