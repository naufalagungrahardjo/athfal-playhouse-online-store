CREATE OR REPLACE FUNCTION public.get_storage_usage()
 RETURNS TABLE(bucket_id text, file_count bigint, total_bytes bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
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
  GROUP BY o.bucket_id

  UNION ALL

  -- Synthetic breakdown row: parent documents are stored inside the
  -- "images" bucket under the parent-documents/ prefix. This row is a
  -- subset of the images bucket and must NOT be added to the grand total.
  SELECT
    'parent-documents'::text AS bucket_id,
    COUNT(*)::bigint AS file_count,
    COALESCE(SUM((o.metadata->>'size')::bigint), 0)::bigint AS total_bytes
  FROM storage.objects o
  WHERE o.bucket_id = 'images'
    AND o.name LIKE 'parent-documents/%'
    AND EXISTS (
      SELECT 1 FROM public.admin_accounts a
      WHERE a.email = auth.email()
        AND a.role = 'super_admin'
    );
$function$;