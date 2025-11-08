-- Ensure RLS policies for blogs allow content team via auth.email() and support UPSERT
-- 1) Drop the policies we just added to replace them with auth.email() variants
DROP POLICY IF EXISTS "Content team can insert blogs" ON public.blogs;
DROP POLICY IF EXISTS "Content team can update blogs" ON public.blogs;
DROP POLICY IF EXISTS "Content team can delete blogs" ON public.blogs;
DROP POLICY IF EXISTS "Content team can view all blogs" ON public.blogs;

-- 2) Recreate policies using auth.email() and include WITH CHECK for UPDATE
CREATE POLICY "Content team can insert blogs"
ON public.blogs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
);

CREATE POLICY "Content team can update blogs"
ON public.blogs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
);

CREATE POLICY "Content team can delete blogs"
ON public.blogs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
);

-- Keep public read for published blogs; add explicit admin read of all
CREATE POLICY "Content team can view all blogs"
ON public.blogs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
);
