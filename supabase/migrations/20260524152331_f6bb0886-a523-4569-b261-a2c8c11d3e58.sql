
-- Helper: check whether the current authenticated user has class-super access
-- (super_admin role OR is in the hardcoded class-super email allowlist)
CREATE OR REPLACE FUNCTION public.is_class_super()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.email() = ANY (ARRAY['ramadhannisa.fadhilah@gmail.com'])
    OR EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE email = auth.email() AND role = 'super_admin'::admin_role
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_class_super() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_class_super() TO authenticated;

-- teacher_attendance
DROP POLICY IF EXISTS "Class super can view all attendance" ON public.teacher_attendance;
CREATE POLICY "Class super can view all attendance"
ON public.teacher_attendance FOR SELECT TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can update any attendance" ON public.teacher_attendance;
CREATE POLICY "Class super can update any attendance"
ON public.teacher_attendance FOR UPDATE TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can delete attendance" ON public.teacher_attendance;
CREATE POLICY "Class super can delete attendance"
ON public.teacher_attendance FOR DELETE TO authenticated
USING (public.is_class_super());

-- teacher_leaves (mirror super_admin powers)
DROP POLICY IF EXISTS "Class super can view all leaves" ON public.teacher_leaves;
CREATE POLICY "Class super can view all leaves"
ON public.teacher_leaves FOR SELECT TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can update leaves" ON public.teacher_leaves;
CREATE POLICY "Class super can update leaves"
ON public.teacher_leaves FOR UPDATE TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can delete leaves" ON public.teacher_leaves;
CREATE POLICY "Class super can delete leaves"
ON public.teacher_leaves FOR DELETE TO authenticated
USING (public.is_class_super());

-- teacher_settings
DROP POLICY IF EXISTS "Class super can manage teacher_settings" ON public.teacher_settings;
CREATE POLICY "Class super can manage teacher_settings"
ON public.teacher_settings FOR ALL TO authenticated
USING (public.is_class_super())
WITH CHECK (public.is_class_super());

-- student_checkinout
DROP POLICY IF EXISTS "Class super can view checkinout" ON public.student_checkinout;
CREATE POLICY "Class super can view checkinout"
ON public.student_checkinout FOR SELECT TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can update checkinout" ON public.student_checkinout;
CREATE POLICY "Class super can update checkinout"
ON public.student_checkinout FOR UPDATE TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can delete checkinout" ON public.student_checkinout;
CREATE POLICY "Class super can delete checkinout"
ON public.student_checkinout FOR DELETE TO authenticated
USING (public.is_class_super());

-- student_attendance
DROP POLICY IF EXISTS "Class super can view student_attendance" ON public.student_attendance;
CREATE POLICY "Class super can view student_attendance"
ON public.student_attendance FOR SELECT TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can update student_attendance" ON public.student_attendance;
CREATE POLICY "Class super can update student_attendance"
ON public.student_attendance FOR UPDATE TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can delete student_attendance" ON public.student_attendance;
CREATE POLICY "Class super can delete student_attendance"
ON public.student_attendance FOR DELETE TO authenticated
USING (public.is_class_super());

-- student_enrollments
DROP POLICY IF EXISTS "Class super can view enrollments" ON public.student_enrollments;
CREATE POLICY "Class super can view enrollments"
ON public.student_enrollments FOR SELECT TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can delete enrollments" ON public.student_enrollments;
CREATE POLICY "Class super can delete enrollments"
ON public.student_enrollments FOR DELETE TO authenticated
USING (public.is_class_super());

-- class_programs
DROP POLICY IF EXISTS "Class super can view programs" ON public.class_programs;
CREATE POLICY "Class super can view programs"
ON public.class_programs FOR SELECT TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can update programs" ON public.class_programs;
CREATE POLICY "Class super can update programs"
ON public.class_programs FOR UPDATE TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can delete programs" ON public.class_programs;
CREATE POLICY "Class super can delete programs"
ON public.class_programs FOR DELETE TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can insert programs" ON public.class_programs;
CREATE POLICY "Class super can insert programs"
ON public.class_programs FOR INSERT TO authenticated
WITH CHECK (public.is_class_super());

-- program_session_dates
DROP POLICY IF EXISTS "Class super can view program session dates" ON public.program_session_dates;
CREATE POLICY "Class super can view program session dates"
ON public.program_session_dates FOR SELECT TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can delete program session dates" ON public.program_session_dates;
CREATE POLICY "Class super can delete program session dates"
ON public.program_session_dates FOR DELETE TO authenticated
USING (public.is_class_super());

-- class_materials
DROP POLICY IF EXISTS "Class super can view class materials" ON public.class_materials;
CREATE POLICY "Class super can view class materials"
ON public.class_materials FOR SELECT TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can update class materials" ON public.class_materials;
CREATE POLICY "Class super can update class materials"
ON public.class_materials FOR UPDATE TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can delete class materials" ON public.class_materials;
CREATE POLICY "Class super can delete class materials"
ON public.class_materials FOR DELETE TO authenticated
USING (public.is_class_super());

DROP POLICY IF EXISTS "Class super can insert class materials" ON public.class_materials;
CREATE POLICY "Class super can insert class materials"
ON public.class_materials FOR INSERT TO authenticated
WITH CHECK (public.is_class_super());
