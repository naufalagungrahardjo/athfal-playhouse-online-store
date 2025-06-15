
-- 1. Create a security definer function to check if the current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE public.admin_accounts.email = email
      AND public.admin_accounts.role = 'super_admin'
  );
$$;

-- 2. Remove the existing (recursive) policy
DROP POLICY IF EXISTS "Super admin can do anything" ON public.admin_accounts;

-- 3. Create a replacement policy using the function
CREATE POLICY "Super admin can manage admin_accounts" ON public.admin_accounts
  FOR ALL
  USING (public.is_super_admin(current_setting('request.jwt.claim.email', true)) )
  WITH CHECK (public.is_super_admin(current_setting('request.jwt.claim.email', true)) );

