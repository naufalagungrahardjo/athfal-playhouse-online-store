CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.student_final_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, field_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_final_reports TO authenticated;
GRANT ALL ON public.student_final_reports TO service_role;

ALTER TABLE public.student_final_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and teacher can view final reports"
ON public.student_final_reports FOR SELECT
USING (
  is_class_super() OR EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role = ANY (ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  )
);

CREATE POLICY "Super admin and teacher can insert final reports"
ON public.student_final_reports FOR INSERT
WITH CHECK (
  is_class_super() OR EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role = ANY (ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  )
);

CREATE POLICY "Super admin and teacher can update final reports"
ON public.student_final_reports FOR UPDATE
USING (
  is_class_super() OR EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role = ANY (ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  )
);

CREATE POLICY "Super admin can delete final reports"
ON public.student_final_reports FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role = 'super_admin'::admin_role
  )
);

CREATE TRIGGER update_student_final_reports_updated_at
BEFORE UPDATE ON public.student_final_reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();