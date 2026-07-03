
CREATE OR REPLACE FUNCTION public.rename_student(p_student_id uuid, p_new_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_old_name text;
  v_new_name text;
BEGIN
  IF NOT (public.is_admin_account_ci() OR public.is_class_super()) THEN
    RAISE EXCEPTION 'Not authorized to rename students';
  END IF;

  v_new_name := trim(coalesce(p_new_name, ''));
  IF v_new_name = '' THEN
    RAISE EXCEPTION 'Student name cannot be empty';
  END IF;

  SELECT name INTO v_old_name FROM public.students WHERE id = p_student_id;
  IF v_old_name IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  UPDATE public.students
  SET name = v_new_name, updated_at = now()
  WHERE id = p_student_id;

  -- Keep the source order child names in sync so auto-enrollment / sync
  -- does not re-create a duplicate student under the old name.
  IF public.normalize_student_program_text(v_old_name)
     <> public.normalize_student_program_text(v_new_name) THEN
    UPDATE public.orders
    SET child_name = v_new_name, updated_at = now()
    WHERE public.normalize_student_program_text(child_name)
        = public.normalize_student_program_text(v_old_name);
  END IF;

  RETURN true;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.rename_student(uuid, text) TO authenticated;
