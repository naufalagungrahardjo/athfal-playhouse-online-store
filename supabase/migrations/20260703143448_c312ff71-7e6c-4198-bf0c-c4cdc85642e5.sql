ALTER TABLE public.student_report_assets
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.class_programs(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS public.student_report_assets_theme_uidx;
DROP INDEX IF EXISTS public.student_report_assets_logo_uidx;
DROP INDEX IF EXISTS public.student_report_assets_landscape_uidx;

CREATE UNIQUE INDEX student_report_assets_theme_uidx
  ON public.student_report_assets (scope, program_id) NULLS NOT DISTINCT
  WHERE (scope = 'theme');
CREATE UNIQUE INDEX student_report_assets_cover_uidx
  ON public.student_report_assets (scope, program_id) NULLS NOT DISTINCT
  WHERE (scope = 'cover');
CREATE UNIQUE INDEX student_report_assets_logo_uidx
  ON public.student_report_assets (scope, program_id) NULLS NOT DISTINCT
  WHERE (scope = 'logo');
CREATE UNIQUE INDEX student_report_assets_landscape_uidx
  ON public.student_report_assets (scope, program_id) NULLS NOT DISTINCT
  WHERE (scope = 'landscape');