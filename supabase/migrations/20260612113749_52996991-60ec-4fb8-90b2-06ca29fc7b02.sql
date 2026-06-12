-- 1. admin_logs: enforce that inserted log rows are attributed to the caller's own email
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;
DROP POLICY IF EXISTS "insert_admin_logs_auth_email" ON public.admin_logs;

CREATE POLICY "Admins can insert own logs"
ON public.admin_logs
FOR INSERT
TO authenticated
WITH CHECK (
  email = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE lower(a.email) = lower(auth.email())
  )
);

-- 2. users: make the insert rule explicit so only a user's own row (id = auth.uid()) can be inserted.
-- Profile creation is still handled by the sync_new_auth_user() SECURITY DEFINER trigger,
-- but this closes the implicit-policy gap and prevents identity spoofing on any client insert.
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());