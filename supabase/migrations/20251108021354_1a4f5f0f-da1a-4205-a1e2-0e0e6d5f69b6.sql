-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Admin users can manage blogs" ON public.blogs;

-- Create new policies that allow content managers, content staff, and super admins to manage blogs
CREATE POLICY "Content team can insert blogs" 
ON public.blogs
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
      AND admin_accounts.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
);

CREATE POLICY "Content team can update blogs" 
ON public.blogs
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
      AND admin_accounts.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
);

CREATE POLICY "Content team can delete blogs" 
ON public.blogs
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
      AND admin_accounts.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
);

CREATE POLICY "Content team can view all blogs" 
ON public.blogs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
      AND admin_accounts.role = ANY (ARRAY['super_admin'::admin_role, 'content_manager'::admin_role, 'content_staff'::admin_role])
  )
);