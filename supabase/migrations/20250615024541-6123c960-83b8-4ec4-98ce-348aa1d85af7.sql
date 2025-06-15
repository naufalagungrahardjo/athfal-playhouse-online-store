
-- 1. Create ENUM for admin roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE public.admin_role AS ENUM (
      'super_admin',
      'orders_manager',
      'order_staff',
      'content_manager',
      'content_staff'
    );
  END IF;
END$$;

-- 2. Admin accounts table (emails and role per admin)
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role public.admin_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Default: Set athfalplayhouse@gmail.com as the only super_admin
INSERT INTO public.admin_accounts (email, role)
SELECT 'athfalplayhouse@gmail.com', 'super_admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_accounts WHERE email = 'athfalplayhouse@gmail.com'
);

-- 4. Allow future assignment of other admins by email and role

-- 5. RLS: Only super_admin can select/insert/update/delete in admin_accounts
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can do anything" ON public.admin_accounts
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = current_setting('request.jwt.claim.email', true)
      AND a.role = 'super_admin'
  ));

/* 
Note: If you use Supabase auth, `current_setting('request.jwt.claim.email', true)` will match the authenticated user's email.
You may change this to check the user_id from the JWT and join to a user profile table if you prefer.
*/
