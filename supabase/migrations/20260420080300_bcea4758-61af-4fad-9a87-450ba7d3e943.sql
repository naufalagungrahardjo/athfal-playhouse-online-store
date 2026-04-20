-- 1) Tighten storage.objects policies on the 'images' bucket
-- Replace overly permissive authenticated DELETE/UPDATE with super_admin-only

DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;

CREATE POLICY "Super admins can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND public.is_super_admin(COALESCE(current_setting('request.jwt.claim.email', true), ''))
);

CREATE POLICY "Super admins can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND public.is_super_admin(COALESCE(current_setting('request.jwt.claim.email', true), ''))
)
WITH CHECK (
  bucket_id = 'images'
  AND public.is_super_admin(COALESCE(current_setting('request.jwt.claim.email', true), ''))
);

-- 2) Add RLS policies on realtime.messages so only authenticated users can
-- subscribe/receive Realtime broadcasts. Public tables (products, categories)
-- are already readable to anon via SELECT policies; broadcasts are restricted
-- to authenticated session users to prevent unauthenticated subscription.

ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can send realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can send realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);
