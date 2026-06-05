-- 1) cron_secrets: make deny-by-default explicit (no client roles may read secret tokens)
REVOKE ALL ON public.cron_secrets FROM anon, authenticated, PUBLIC;

-- 2) payment_methods: hide internal mdr_rate from non-admin clients via column-level privileges
REVOKE SELECT (mdr_rate) ON public.payment_methods FROM anon, authenticated;

-- Admin-only accessor that returns full payment method rows including mdr_rate.
-- SECURITY DEFINER runs as owner so it can read the protected column,
-- but it only returns rows when the caller is an admin account.
CREATE OR REPLACE FUNCTION public.get_admin_payment_methods()
RETURNS SETOF public.payment_methods
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT *
  FROM public.payment_methods
  WHERE public.is_admin_account(auth.email())
  ORDER BY created_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_payment_methods() TO authenticated;