CREATE OR REPLACE FUNCTION public.get_teacher_display_names(emails text[])
RETURNS TABLE(email text, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email, u.name
  FROM public.users u
  WHERE u.email = ANY(emails)
    AND (
      EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email())
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_teacher_display_names(text[]) TO authenticated;