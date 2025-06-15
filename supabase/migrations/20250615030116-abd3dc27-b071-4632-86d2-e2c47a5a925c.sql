
-- 1. Function to sync new auth users into public.users
CREATE OR REPLACE FUNCTION public.sync_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, password, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', ''), 
    '', -- No password: handled by Supabase Auth, leave this blank or fill with a placeholder
    now(), 
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger after insert on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.sync_new_auth_user();
