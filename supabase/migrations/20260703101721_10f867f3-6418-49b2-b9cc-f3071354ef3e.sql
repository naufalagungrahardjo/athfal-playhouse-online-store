
ALTER TABLE public.backup_students_20260703 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_enrollments_20260703 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_attendance_20260703 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_checkinout_20260703 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_final_reports_20260703 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.backup_students_20260703 FROM anon, authenticated;
REVOKE ALL ON public.backup_enrollments_20260703 FROM anon, authenticated;
REVOKE ALL ON public.backup_attendance_20260703 FROM anon, authenticated;
REVOKE ALL ON public.backup_checkinout_20260703 FROM anon, authenticated;
REVOKE ALL ON public.backup_final_reports_20260703 FROM anon, authenticated;
