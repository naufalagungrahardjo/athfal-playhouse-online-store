CREATE OR REPLACE FUNCTION public.get_storage_usage()
RETURNS TABLE(bucket_id text, file_count bigint, total_bytes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT
    o.bucket_id,
    COUNT(*)::bigint AS file_count,
    COALESCE(SUM((o.metadata->>'size')::bigint), 0)::bigint AS total_bytes
  FROM storage.objects o
  WHERE EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role = 'super_admin'
  )
  GROUP BY o.bucket_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_storage_usage() TO authenticated;