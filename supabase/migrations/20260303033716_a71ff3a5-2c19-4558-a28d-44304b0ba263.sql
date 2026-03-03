
-- Add 'teacher' to admin_role enum
ALTER TYPE public.admin_role ADD VALUE IF NOT EXISTS 'teacher';

-- Teacher attendance table
CREATE TABLE public.teacher_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrival_time TIMESTAMPTZ,
  leave_time TEXT,
  sessions TEXT[] DEFAULT '{}',
  evidence_url TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own attendance" ON public.teacher_attendance
  FOR SELECT USING (
    teacher_email = auth.email()
    OR EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin')
  );

CREATE POLICY "Teachers can insert own attendance" ON public.teacher_attendance
  FOR INSERT WITH CHECK (teacher_email = auth.email());

CREATE POLICY "Teachers can update own attendance" ON public.teacher_attendance
  FOR UPDATE USING (teacher_email = auth.email());

CREATE POLICY "Super admin can update any attendance" ON public.teacher_attendance
  FOR UPDATE USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin'));

-- Teacher leaves table
CREATE TABLE public.teacher_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teacher_leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own leaves" ON public.teacher_leaves
  FOR SELECT USING (
    teacher_email = auth.email()
    OR EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin')
  );

CREATE POLICY "Teachers can insert own leaves" ON public.teacher_leaves
  FOR INSERT WITH CHECK (teacher_email = auth.email());

CREATE POLICY "Super admin can update leaves" ON public.teacher_leaves
  FOR UPDATE USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin'));

-- Teacher settings (Google Drive folder per teacher)
CREATE TABLE public.teacher_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email TEXT NOT NULL UNIQUE,
  google_drive_folder TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teacher_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own settings" ON public.teacher_settings
  FOR SELECT USING (
    teacher_email = auth.email()
    OR EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin')
  );

CREATE POLICY "Super admin can insert teacher settings" ON public.teacher_settings
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin'));

CREATE POLICY "Super admin can update teacher settings" ON public.teacher_settings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin'));

CREATE POLICY "Super admin can delete teacher settings" ON public.teacher_settings
  FOR DELETE USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email() AND role = 'super_admin'));
