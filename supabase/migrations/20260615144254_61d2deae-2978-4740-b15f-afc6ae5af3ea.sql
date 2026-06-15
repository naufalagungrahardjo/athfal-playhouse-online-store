-- Allow any admin account (not just teachers) to record and manage their own attendance,
-- and to view all attendance records so non-teacher staff appear in the All Teachers Attendance.

-- INSERT: any admin_account role can insert their own attendance row
DROP POLICY IF EXISTS "Teachers can insert own attendance" ON public.teacher_attendance;
CREATE POLICY "Staff can insert own attendance"
ON public.teacher_attendance
FOR INSERT
WITH CHECK (
  teacher_email = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
  )
);

-- UPDATE: any admin_account role can update their own attendance row
DROP POLICY IF EXISTS "Teachers can update own attendance" ON public.teacher_attendance;
CREATE POLICY "Staff can update own attendance"
ON public.teacher_attendance
FOR UPDATE
USING (
  teacher_email = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
  )
)
WITH CHECK (
  teacher_email = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
  )
);

-- SELECT: any admin_account can view all attendance records (needed for the
-- shared "Teachers Record" / All Teachers Attendance views), plus own record.
DROP POLICY IF EXISTS "Teachers can view own attendance" ON public.teacher_attendance;
CREATE POLICY "Staff can view all attendance"
ON public.teacher_attendance
FOR SELECT
USING (
  teacher_email = auth.email()
  OR EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
  )
);