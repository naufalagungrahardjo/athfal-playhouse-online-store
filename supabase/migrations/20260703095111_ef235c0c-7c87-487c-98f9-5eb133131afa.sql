-- Allow class-super users (granted via is_class_super) to upload/replace report images,
-- not just users with an admin_accounts role. This fixes teachers/class-super users
-- (e.g. ramadhannisa.fadhilah@gmail.com) being unable to upload student report photos.

DROP POLICY IF EXISTS "Staff can upload report images" ON storage.objects;
CREATE POLICY "Staff can upload report images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (
    is_class_super()
    OR EXISTS (
      SELECT 1 FROM public.admin_accounts a
      WHERE a.email = auth.email()
        AND a.role = ANY (ARRAY['super_admin','content_manager','content_staff','orders_manager','order_staff','teacher']::admin_role[])
    )
  )
);

-- Allow the same staff to update (needed for thumbnail upsert on the images bucket).
DROP POLICY IF EXISTS "Staff can update report images" ON storage.objects;
CREATE POLICY "Staff can update report images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (
    is_class_super()
    OR EXISTS (
      SELECT 1 FROM public.admin_accounts a
      WHERE a.email = auth.email()
        AND a.role = ANY (ARRAY['super_admin','content_manager','content_staff','orders_manager','order_staff','teacher']::admin_role[])
    )
  )
)
WITH CHECK (
  bucket_id = 'images'
  AND (
    is_class_super()
    OR EXISTS (
      SELECT 1 FROM public.admin_accounts a
      WHERE a.email = auth.email()
        AND a.role = ANY (ARRAY['super_admin','content_manager','content_staff','orders_manager','order_staff','teacher']::admin_role[])
    )
  )
);