DROP POLICY IF EXISTS "Teachers can insert own attendance" ON public.teacher_attendance;
CREATE POLICY "Teachers can insert own attendance"
ON public.teacher_attendance
FOR INSERT
WITH CHECK (
  teacher_email = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role IN ('teacher'::admin_role, 'super_admin'::admin_role)
  )
);

DROP POLICY IF EXISTS "Teachers can update own attendance" ON public.teacher_attendance;
CREATE POLICY "Teachers can update own attendance"
ON public.teacher_attendance
FOR UPDATE
USING (
  teacher_email = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role IN ('teacher'::admin_role, 'super_admin'::admin_role)
  )
);

DROP POLICY IF EXISTS "Teachers can insert own leaves" ON public.teacher_leaves;
CREATE POLICY "Teachers can insert own leaves"
ON public.teacher_leaves
FOR INSERT
WITH CHECK (
  teacher_email = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role IN ('teacher'::admin_role, 'super_admin'::admin_role)
  )
);