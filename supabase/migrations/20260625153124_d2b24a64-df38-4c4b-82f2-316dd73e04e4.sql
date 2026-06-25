-- Add recipient targeting to parent documents
ALTER TABLE public.parent_documents
  ADD COLUMN IF NOT EXISTS recipient_emails text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Replace read policy so documents are only visible to targeted recipients
-- (empty recipient list = visible to all eligible parents, for backward compatibility)
DROP POLICY IF EXISTS "Eligible parents can view documents" ON public.parent_documents;

CREATE POLICY "Eligible parents can view documents"
ON public.parent_documents
FOR SELECT
USING (
  public.can_manage_parent_documents()
  OR (
    public.can_access_parent_portal()
    AND (
      coalesce(array_length(recipient_emails, 1), 0) = 0
      OR lower(auth.email()) = ANY (
        SELECT lower(e) FROM unnest(recipient_emails) AS e
      )
    )
  )
);

-- RPC for admins to list eligible parent-portal recipients (customers with a
-- processing/completed order and a child enrolled), so admins can pick who
-- each document is sent to.
CREATE OR REPLACE FUNCTION public.list_parent_document_recipients()
RETURNS TABLE(email text, name text, child_names text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    lower(o.customer_email) AS email,
    COALESCE(NULLIF(trim(max(o.customer_name)), ''), lower(o.customer_email)) AS name,
    string_agg(DISTINCT trim(o.child_name), ', ') AS child_names
  FROM public.orders o
  WHERE public.can_manage_parent_documents()
    AND o.status IN ('processing', 'completed')
    AND trim(coalesce(o.customer_email, '')) <> ''
  GROUP BY lower(o.customer_email)
  ORDER BY name;
$$;

GRANT EXECUTE ON FUNCTION public.list_parent_document_recipients() TO authenticated;