INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'club_manager'::app_role FROM auth.users u WHERE u.email = 'club.manager@the-ace.academy'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also make this user the owner of the demo club if one exists
UPDATE public.clubs
SET owner_id = (SELECT id FROM auth.users WHERE email = 'club.manager@the-ace.academy')
WHERE slug = 'ace-demo-club' AND (SELECT id FROM auth.users WHERE email = 'club.manager@the-ace.academy') IS NOT NULL;