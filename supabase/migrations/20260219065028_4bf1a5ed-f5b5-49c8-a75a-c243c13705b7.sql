
-- Drop old policies that use is_admin_user (which checks admin_users table, not admin_accounts)
DROP POLICY IF EXISTS "Admins can update website copy" ON public.website_copy;
DROP POLICY IF EXISTS "Admins can insert website copy" ON public.website_copy;

-- Create new policies using admin_accounts (where Content Managers actually exist)
CREATE POLICY "Admins can update website copy" ON public.website_copy
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role IN ('super_admin', 'content_manager', 'content_staff')
  )
);

CREATE POLICY "Admins can insert website copy" ON public.website_copy
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role IN ('super_admin', 'content_manager', 'content_staff')
  )
);
