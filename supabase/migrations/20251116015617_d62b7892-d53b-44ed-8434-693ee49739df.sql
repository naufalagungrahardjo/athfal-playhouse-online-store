-- Backfill missing users from auth.users to public.users
INSERT INTO public.users (id, email, name, password, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  '',
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;