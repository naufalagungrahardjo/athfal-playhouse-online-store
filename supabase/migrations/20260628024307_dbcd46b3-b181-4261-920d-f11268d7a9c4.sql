DROP POLICY IF EXISTS "Only admins can upload images" ON storage.objects;

CREATE POLICY "Staff can upload report images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND EXISTS (
    SELECT 1
    FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role IN ('super_admin','content_manager','content_staff','orders_manager','order_staff','teacher')
  )
);