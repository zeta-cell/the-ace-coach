-- 1) Bookings: enforce server-side initial status and prevent player self-confirm
CREATE OR REPLACE FUNCTION public.bookings_enforce_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auto boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF public.has_role(auth.uid(), 'admin') OR auth.uid() = NEW.coach_id THEN
      RETURN NEW;
    END IF;
    IF NEW.package_id IS NOT NULL THEN
      SELECT COALESCE(auto_confirm, false) INTO v_auto
      FROM public.coach_packages WHERE id = NEW.package_id;
    END IF;
    NEW.status := CASE WHEN v_auto THEN 'confirmed' ELSE 'pending' END;
    RETURN NEW;
  END IF;

  -- UPDATE: only coach/admin (or club manager) may confirm
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status = 'confirmed'
     AND NOT (
       public.has_role(auth.uid(), 'admin')
       OR auth.uid() = NEW.coach_id
       OR (NEW.club_id IS NOT NULL AND public.is_club_manager(auth.uid(), NEW.club_id))
     ) THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_enforce_status_ins ON public.bookings;
CREATE TRIGGER bookings_enforce_status_ins
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.bookings_enforce_status();

DROP TRIGGER IF EXISTS bookings_enforce_status_upd ON public.bookings;
CREATE TRIGGER bookings_enforce_status_upd
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.bookings_enforce_status();

-- 2) Storage: coach-videos uploads restricted to own module folder
DROP POLICY IF EXISTS "Coaches upload videos" ON storage.objects;
CREATE POLICY "Coaches upload videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'coach-videos'
  AND EXISTS (
    SELECT 1 FROM public.modules m
    WHERE (m.id)::text = (storage.foldername(name))[2]
      AND m.created_by = auth.uid()
  )
);

-- 3) Messages: receiver may only flip is_read, never rewrite content
CREATE OR REPLACE FUNCTION public.messages_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.id := OLD.id;
  NEW.sender_id := OLD.sender_id;
  NEW.receiver_id := OLD.receiver_id;
  NEW.content := OLD.content;
  NEW.attachment_url := OLD.attachment_url;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_guard_update_upd ON public.messages;
CREATE TRIGGER messages_guard_update_upd
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.messages_guard_update();

DROP POLICY IF EXISTS "Users can update own sent messages" ON public.messages;
CREATE POLICY "Receivers can mark messages read"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);