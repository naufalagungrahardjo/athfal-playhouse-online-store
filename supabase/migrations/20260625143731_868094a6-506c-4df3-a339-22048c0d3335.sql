-- 1. Blog "parent reference" toggle
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS is_parent_reference boolean NOT NULL DEFAULT false;

-- 2. Parent documents table
CREATE TABLE IF NOT EXISTS public.parent_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf',
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_documents TO authenticated;
GRANT ALL ON public.parent_documents TO service_role;

ALTER TABLE public.parent_documents ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_parent_documents_updated_at
BEFORE UPDATE ON public.parent_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Eligibility: customer registered by buying via website, processing/completed status, has attendance access
CREATE OR REPLACE FUNCTION public.can_access_parent_portal()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.students s
      ON public.normalize_student_program_text(s.name)
       = public.normalize_student_program_text(o.child_name)
    WHERE lower(o.customer_email) = lower(auth.email())
      AND o.status IN ('processing', 'completed')
      AND trim(coalesce(o.child_name, '')) <> ''
  );
$$;

-- 4. Who can manage documents (super admin or anyone granted the documents menu)
CREATE OR REPLACE FUNCTION public.can_manage_parent_documents()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND (a.role = 'super_admin'::admin_role
           OR '/admin/documents' = ANY(coalesce(a.allowed_menus, ARRAY[]::text[])))
  );
$$;

-- 5. RLS policies for parent_documents
CREATE POLICY "Eligible parents can view documents"
ON public.parent_documents FOR SELECT
USING (public.can_access_parent_portal() OR public.can_manage_parent_documents());

CREATE POLICY "Admins can insert documents"
ON public.parent_documents FOR INSERT
WITH CHECK (public.can_manage_parent_documents());

CREATE POLICY "Admins can update documents"
ON public.parent_documents FOR UPDATE
USING (public.can_manage_parent_documents());

CREATE POLICY "Admins can delete documents"
ON public.parent_documents FOR DELETE
USING (public.can_manage_parent_documents());