UPDATE auth.users
SET email = 'pesoumar@yahoo.com',
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE id = '0158c62e-6ddb-45f5-89e6-11b357af9087';

UPDATE auth.identities
SET identity_data = jsonb_set(jsonb_set(identity_data, '{email}', '"pesoumar@yahoo.com"'), '{email_verified}', 'true'),
    updated_at = now()
WHERE user_id = '0158c62e-6ddb-45f5-89e6-11b357af9087'
  AND provider = 'email';