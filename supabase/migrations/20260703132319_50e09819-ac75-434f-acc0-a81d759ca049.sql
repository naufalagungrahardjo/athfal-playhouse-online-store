ALTER TABLE public.student_report_assets DROP CONSTRAINT IF EXISTS student_report_assets_scope_check;
ALTER TABLE public.student_report_assets ADD CONSTRAINT student_report_assets_scope_check CHECK (scope = ANY (ARRAY['theme'::text, 'photo'::text, 'cover'::text, 'logo'::text]));

CREATE UNIQUE INDEX IF NOT EXISTS student_report_assets_logo_uidx
  ON public.student_report_assets ((scope)) WHERE scope = 'logo';