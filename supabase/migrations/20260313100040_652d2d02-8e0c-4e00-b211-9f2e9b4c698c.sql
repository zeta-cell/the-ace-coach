DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@the-ace.academy';
  
  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_uid, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    
    UPDATE public.profiles 
    SET email = 'admin@the-ace.academy', full_name = 'Admin Ace'
    WHERE user_id = admin_uid;
  END IF;
END $$;