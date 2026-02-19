
-- Drop the legacy password column from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- Update sync_new_auth_user() to remove password reference
CREATE OR REPLACE FUNCTION public.sync_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', ''), 
    now(), 
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
