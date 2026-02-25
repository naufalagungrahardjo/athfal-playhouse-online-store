-- Sync all existing auth.users into public.users that are not yet tracked
INSERT INTO public.users (id, email, name, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE(created_at, now()),
  now()
FROM auth.users
ON CONFLICT (id) DO UPDATE
  SET name = CASE 
    WHEN public.users.name = '' OR public.users.name IS NULL 
    THEN EXCLUDED.name 
    ELSE public.users.name 
  END;