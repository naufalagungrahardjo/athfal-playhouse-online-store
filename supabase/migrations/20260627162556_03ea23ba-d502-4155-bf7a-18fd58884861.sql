-- Stores PDF student-report visual assets: a global theme background (PNG)
-- and per-student, per-page student photos.
CREATE TABLE public.student_report_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('theme', 'photo')),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  page_key text,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One photo per student per page; a single global theme row.
CREATE UNIQUE INDEX student_report_assets_photo_uidx
  ON public.student_report_assets (student_id, page_key) WHERE scope = 'photo';
CREATE UNIQUE INDEX student_report_assets_theme_uidx
  ON public.student_report_assets ((scope)) WHERE scope = 'theme';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_report_assets TO authenticated;
GRANT ALL ON public.student_report_assets TO service_role;

ALTER TABLE public.student_report_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class staff can view report assets"
  ON public.student_report_assets FOR SELECT
  USING (is_class_super() OR EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email() AND role = ANY (ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  ));

CREATE POLICY "Class staff can insert report assets"
  ON public.student_report_assets FOR INSERT
  WITH CHECK (is_class_super() OR EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email() AND role = ANY (ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  ));

CREATE POLICY "Class staff can update report assets"
  ON public.student_report_assets FOR UPDATE
  USING (is_class_super() OR EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email() AND role = ANY (ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  ));

CREATE POLICY "Class staff can delete report assets"
  ON public.student_report_assets FOR DELETE
  USING (is_class_super() OR EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email() AND role = ANY (ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  ));

CREATE TRIGGER set_student_report_assets_updated_at
  BEFORE UPDATE ON public.student_report_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();