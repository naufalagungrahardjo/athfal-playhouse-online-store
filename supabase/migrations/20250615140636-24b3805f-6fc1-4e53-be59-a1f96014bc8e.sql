
-- Fix for: public.is_admin_user (explicit search_path)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = is_admin_user.user_id
  );
$$;

-- Fix for: public.sync_new_auth_user (explicit search_path)
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix for: public.is_super_admin (explicit search_path)
CREATE OR REPLACE FUNCTION public.is_super_admin(email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE public.admin_accounts.email = email
      AND public.admin_accounts.role = 'super_admin'
  );
$$;
