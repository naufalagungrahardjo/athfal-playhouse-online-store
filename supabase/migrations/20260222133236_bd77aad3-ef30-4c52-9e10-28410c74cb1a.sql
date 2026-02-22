
-- =============================================
-- FIX: Categories - Replace "allow all" with proper admin-only write + public read
-- =============================================

-- Drop the overly permissive "allow all" policy
DROP POLICY IF EXISTS "Allow all access to categories" ON public.categories;

-- Public can read categories
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
USING (true);

-- Only admins can insert categories
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'orders_manager', 'content_manager')
  )
);

-- Only admins can update categories
CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'orders_manager', 'content_manager')
  )
);

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'orders_manager')
  )
);

-- =============================================
-- FIX: Testimonials - Replace "true" admin policies with actual admin checks
-- =============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Admins can delete " ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert " ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update " ON public.testimonials;

-- Proper admin-only insert
CREATE POLICY "Admins can insert testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'content_manager', 'content_staff')
  )
);

-- Proper admin-only update
CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'content_manager', 'content_staff')
  )
);

-- Proper admin-only delete
CREATE POLICY "Admins can delete testimonials"
ON public.testimonials
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'content_manager')
  )
);
