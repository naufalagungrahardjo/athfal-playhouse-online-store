CREATE POLICY "Super admin can delete teacher attendance"
ON public.teacher_attendance
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role = 'super_admin'
  )
);