-- Broaden teacher-evidence upload policy to any admin_accounts staff (not only teacher/super_admin)
DROP POLICY IF EXISTS "Teachers can upload evidence" ON storage.objects;
CREATE POLICY "Staff can upload evidence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'teacher-evidence'
  AND (storage.foldername(name))[1] = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
  )
);

-- Allow staff to view their own evidence (and super_admin to view all)
DROP POLICY IF EXISTS "Teachers and admins can view evidence" ON storage.objects;
CREATE POLICY "Staff and admins can view evidence"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'teacher-evidence'
  AND (
    (storage.foldername(name))[1] = auth.email()
    OR EXISTS (
      SELECT 1 FROM public.admin_accounts a
      WHERE a.email = auth.email()
    )
  )
);

-- Allow staff to update their own evidence files (for upsert/overwrite scenarios)
DROP POLICY IF EXISTS "Staff can update evidence" ON storage.objects;
CREATE POLICY "Staff can update evidence"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'teacher-evidence'
  AND (storage.foldername(name))[1] = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
  )
)
WITH CHECK (
  bucket_id = 'teacher-evidence'
  AND (storage.foldername(name))[1] = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
  )
);