
-- Class Programs table
CREATE TABLE public.class_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  num_meetings integer NOT NULL DEFAULT 1,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.class_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and teacher can view programs" ON public.class_programs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin and teacher can insert programs" ON public.class_programs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin and teacher can update programs" ON public.class_programs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin can delete programs" ON public.class_programs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin')
  );

-- Students table
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and teacher can view students" ON public.students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin and teacher can insert students" ON public.students
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin and teacher can update students" ON public.students
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin can delete students" ON public.students
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin')
  );

-- Student Enrollments (many-to-many)
CREATE TABLE public.student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.class_programs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, program_id)
);

ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and teacher can view enrollments" ON public.student_enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin and teacher can insert enrollments" ON public.student_enrollments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin and teacher can delete enrollments" ON public.student_enrollments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

-- Student Attendance records per meeting
CREATE TABLE public.student_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.student_enrollments(id) ON DELETE CASCADE,
  meeting_number integer NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  attendance_status text NOT NULL DEFAULT 'present',
  motorik_halus text DEFAULT '',
  motorik_kasar text DEFAULT '',
  kognisi text DEFAULT '',
  bahasa text DEFAULT '',
  sosial_emosional text DEFAULT '',
  kemandirian text DEFAULT '',
  tahsin text DEFAULT '',
  tahfidz text DEFAULT '',
  teacher_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, meeting_number)
);

ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and teacher can view attendance" ON public.student_attendance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin and teacher can insert attendance" ON public.student_attendance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin and teacher can update attendance" ON public.student_attendance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role IN ('super_admin', 'teacher'))
  );

CREATE POLICY "Super admin can delete attendance" ON public.student_attendance
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin')
  );
