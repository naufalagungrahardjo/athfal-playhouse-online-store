CREATE OR REPLACE FUNCTION public.can_access_student_menu()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    -- Admin / staff accounts always have access
    EXISTS (
      SELECT 1 FROM public.admin_accounts a
      WHERE lower(a.email) = lower(auth.email())
    )
    OR
    -- Verified buyers with a processing or completed order
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE lower(o.customer_email) = lower(auth.email())
        AND o.status IN ('processing', 'completed')
    );
$function$;

GRANT EXECUTE ON FUNCTION public.can_access_student_menu() TO authenticated;