DROP FUNCTION IF EXISTS public.list_teacher_recipients();
CREATE OR REPLACE FUNCTION public.list_teacher_recipients()
RETURNS TABLE(email text, name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT a.email, COALESCE(NULLIF(trim(u.name), ''), a.email) AS name
  FROM public.admin_accounts a
  LEFT JOIN public.users u ON u.email = a.email
  WHERE a.role = 'teacher'
  ORDER BY name;
$$;