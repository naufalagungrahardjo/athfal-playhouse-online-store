
-- 1. Harden parent portal access: remove fuzzy student-name join.
-- Access to individual documents is still gated by recipient_emails allowlist
-- on public.parent_documents policies.
CREATE OR REPLACE FUNCTION public.can_access_parent_portal()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE lower(o.customer_email) = lower(auth.email())
      AND o.status IN ('processing', 'completed')
  );
$function$;

-- 2. Restrict listing of the shared "images" bucket to admins.
-- Individual files remain publicly readable via direct public URLs
-- (Supabase serves public-bucket files without RLS on the public endpoint).
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for images" ON storage.objects;

CREATE POLICY "Admins can list images bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'
  AND public.is_admin_account(auth.email())
);
