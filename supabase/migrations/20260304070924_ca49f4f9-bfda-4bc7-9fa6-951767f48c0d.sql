-- Drop the existing RESTRICTIVE SELECT policy
DROP POLICY IF EXISTS "Teachers can view own settings" ON public.teacher_settings;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Teachers can view own settings"
ON public.teacher_settings
FOR SELECT
TO authenticated
USING (
  teacher_email = auth.email()
  OR EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role = 'super_admin'::admin_role
  )
);