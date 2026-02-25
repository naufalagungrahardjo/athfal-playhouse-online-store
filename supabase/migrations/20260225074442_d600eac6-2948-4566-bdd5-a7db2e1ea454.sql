-- Allow super_admin and orders_manager to delete any user from the public.users table
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = auth.email()
        AND admin_accounts.role IN ('super_admin', 'orders_manager')
    )
  );