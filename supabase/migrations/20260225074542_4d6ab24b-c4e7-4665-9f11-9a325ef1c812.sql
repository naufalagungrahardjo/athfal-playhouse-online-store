-- Drop the existing admin delete policy and recreate with super_admin only
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "Super admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = auth.email()
        AND admin_accounts.role = 'super_admin'
    )
  );