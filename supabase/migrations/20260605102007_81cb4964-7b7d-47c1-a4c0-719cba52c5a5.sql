-- 1. Cron secrets: lock down completely to service-role only.
REVOKE ALL ON public.cron_secrets FROM anon, authenticated;
GRANT ALL ON public.cron_secrets TO service_role;

-- 2. Payment methods: hide the internal mdr_rate from public/auth direct reads
--    via column-level SELECT privileges. Admins read mdr_rate through the
--    SECURITY DEFINER RPC get_admin_payment_methods, and writes are unaffected.
REVOKE SELECT ON public.payment_methods FROM anon, authenticated;
GRANT SELECT (id, bank_name, account_number, account_name, active, created_at, updated_at, payment_steps, image)
  ON public.payment_methods TO anon, authenticated;

-- 3. Realtime: remove the overly permissive "any authenticated user can read any
--    channel" policy. The app only uses postgres_changes (protected by each public
--    table's own RLS), so this does not affect live updates.
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;