
-- 1. Create a function to check if the email belongs to a super_admin or any admin_accounts role
CREATE OR REPLACE FUNCTION public.is_admin_account(email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE public.admin_accounts.email = email
    -- You could restrict by role here if needed, e.g. AND role = 'super_admin'
  );
$$;

-- 2. Enable RLS (if not already enabled)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 3. Allow admin_accounts to SELECT (view is often needed by admins)
CREATE POLICY "Admin accounts can view payment methods"
  ON public.payment_methods
  FOR SELECT
  USING (
    public.is_admin_account(current_setting('request.jwt.claim.email', true))
  );

-- 4. Allow admin_accounts to INSERT
CREATE POLICY "Admin accounts can insert payment methods"
  ON public.payment_methods
  FOR INSERT
  WITH CHECK (
    public.is_admin_account(current_setting('request.jwt.claim.email', true))
  );

-- 5. Allow admin_accounts to UPDATE
CREATE POLICY "Admin accounts can update payment methods"
  ON public.payment_methods
  FOR UPDATE
  USING (
    public.is_admin_account(current_setting('request.jwt.claim.email', true))
  );

-- 6. Allow admin_accounts to DELETE
CREATE POLICY "Admin accounts can delete payment methods"
  ON public.payment_methods
  FOR DELETE
  USING (
    public.is_admin_account(current_setting('request.jwt.claim.email', true))
  );

