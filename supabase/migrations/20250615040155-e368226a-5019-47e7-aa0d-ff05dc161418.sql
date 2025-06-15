
-- 1. Fix RLS INIT performance for admin_accounts
DROP POLICY IF EXISTS "Super admin can manage admin_accounts" ON public.admin_accounts;
CREATE POLICY "Super admin can manage admin_accounts" ON public.admin_accounts
  FOR ALL
  USING (
      public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true)))
  )
  WITH CHECK (
      public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true)))
  );

-- 2. Fix RLS INIT performance for blogs
-- Remove redundant and permissive policies on blogs
DROP POLICY IF EXISTS "Admin users can manage blogs" ON public.blogs;
DROP POLICY IF EXISTS "Allow admin full access to blogs" ON public.blogs;
DROP POLICY IF EXISTS "Allow public read access to published blogs" ON public.blogs;
DROP POLICY IF EXISTS "Anyone can view published blogs" ON public.blogs;

-- Add one consolidated admin policy and one for public reads
CREATE POLICY "Admin users can manage blogs" ON public.blogs
  FOR ALL
  USING (
    public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true)))
  )
  WITH CHECK (
    public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true)))
  );

CREATE POLICY "Public can view published blogs" ON public.blogs
  FOR SELECT
  USING (published IS TRUE);

-- 3. Remove duplicate policies for admin_users
DROP POLICY IF EXISTS "Allow admins to modify admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admins to read admin users" ON public.admin_users;

-- Consolidate into one
CREATE POLICY "Admins can read and modify admin users" ON public.admin_users
  FOR ALL
  USING (
    public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true)))
  )
  WITH CHECK (
    public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true)))
  );
