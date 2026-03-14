-- Add unique constraint on user_roles.user_id so upsert works
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);