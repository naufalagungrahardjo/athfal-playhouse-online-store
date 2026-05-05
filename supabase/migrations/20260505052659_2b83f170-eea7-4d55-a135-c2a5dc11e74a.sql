
-- 1) Hide mdr_rate (internal financial config) from anonymous users
REVOKE SELECT (mdr_rate) ON public.payment_methods FROM anon;

-- 2) Tighten realtime.messages: replace overly broad INSERT with deny-by-default.
-- App relies on postgres_changes (server-to-client) only; no client broadcast needed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
  ) THEN
    -- Drop common permissive policies if present
    EXECUTE (
      SELECT string_agg(
        format('DROP POLICY IF EXISTS %I ON realtime.messages;', policyname),
        ' '
      )
      FROM pg_policies
      WHERE schemaname = 'realtime' AND tablename = 'messages'
    );
  END IF;
END $$;

-- Allow authenticated users to receive realtime broadcasts (SELECT) but not send (no INSERT)
CREATE POLICY "Authenticated can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
