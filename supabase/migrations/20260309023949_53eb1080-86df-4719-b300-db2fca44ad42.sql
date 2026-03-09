
-- Create class_materials table
CREATE TABLE public.class_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.class_programs(id) ON DELETE CASCADE,
  detail text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

-- Super admin and teacher can view
CREATE POLICY "Super admin and teacher can view class materials"
  ON public.class_materials FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role = ANY(ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  ));

-- Super admin and teacher can insert
CREATE POLICY "Super admin and teacher can insert class materials"
  ON public.class_materials FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role = ANY(ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  ));

-- Super admin and teacher can update
CREATE POLICY "Super admin and teacher can update class materials"
  ON public.class_materials FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role = ANY(ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  ));

-- Super admin can delete
CREATE POLICY "Super admin and teacher can delete class materials"
  ON public.class_materials FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role = ANY(ARRAY['super_admin'::admin_role, 'teacher'::admin_role])
  ));
