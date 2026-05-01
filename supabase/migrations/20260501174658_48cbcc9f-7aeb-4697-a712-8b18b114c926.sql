ALTER TABLE public.class_programs
ADD COLUMN IF NOT EXISTS source_product_names text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_class_programs_source_product_names
ON public.class_programs USING gin (source_product_names);

CREATE OR REPLACE FUNCTION public.normalize_student_program_text(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT lower(regexp_replace(trim(coalesce(p_text, '')), '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.program_matches_product_names(p_source_product_names text[], p_product_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(coalesce(p_source_product_names, '{}'::text[])) AS src(name)
    WHERE public.normalize_student_program_text(p_product_name) = public.normalize_student_program_text(src.name)
       OR public.normalize_student_program_text(p_product_name) LIKE public.normalize_student_program_text(src.name) || '%'
  );
$$;

CREATE OR REPLACE FUNCTION public.ensure_student_from_child_name(p_child_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_trimmed text;
  v_normalized text;
  v_student_id uuid;
BEGIN
  v_trimmed := trim(coalesce(p_child_name, ''));
  IF v_trimmed = '' THEN
    RETURN NULL;
  END IF;

  v_normalized := public.normalize_student_program_text(v_trimmed);
  PERFORM pg_advisory_xact_lock(hashtext(v_normalized));

  SELECT s.id
  INTO v_student_id
  FROM public.students s
  WHERE public.normalize_student_program_text(s.name) = v_normalized
  ORDER BY s.created_at ASC
  LIMIT 1;

  IF v_student_id IS NULL THEN
    INSERT INTO public.students (name)
    VALUES (v_trimmed)
    RETURNING id INTO v_student_id;
  END IF;

  RETURN v_student_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_program_enrollments(
  p_program_id uuid,
  p_source_product_names text[] DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_source_product_names text[];
  v_child_name text;
  v_student_id uuid;
  v_row_count integer := 0;
  v_total_inserted integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_accounts
    WHERE email = auth.email()
      AND role IN ('super_admin', 'teacher')
  ) THEN
    RAISE EXCEPTION 'Not authorized to sync program enrollments';
  END IF;

  SELECT CASE
           WHEN coalesce(array_length(p_source_product_names, 1), 0) > 0 THEN p_source_product_names
           ELSE source_product_names
         END
  INTO v_source_product_names
  FROM public.class_programs
  WHERE id = p_program_id;

  IF coalesce(array_length(v_source_product_names, 1), 0) = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.class_programs
  SET source_product_names = v_source_product_names,
      updated_at = now()
  WHERE id = p_program_id
    AND source_product_names IS DISTINCT FROM v_source_product_names;

  FOR v_child_name IN
    SELECT DISTINCT trim(o.child_name)
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.status <> 'cancelled'
      AND trim(coalesce(o.child_name, '')) <> ''
      AND public.program_matches_product_names(v_source_product_names, oi.product_name)
  LOOP
    v_student_id := public.ensure_student_from_child_name(v_child_name);

    IF v_student_id IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.student_enrollments (student_id, program_id)
    VALUES (v_student_id, p_program_id)
    ON CONFLICT (student_id, program_id) DO NOTHING;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
  END LOOP;

  RETURN v_total_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_enroll_order_to_active_programs(p_order_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_order record;
  v_program_id uuid;
  v_student_id uuid;
  v_row_count integer := 0;
  v_total_inserted integer := 0;
BEGIN
  SELECT o.id, o.child_name, o.status
  INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
  LIMIT 1;

  IF NOT FOUND OR trim(coalesce(v_order.child_name, '')) = '' OR v_order.status = 'cancelled' THEN
    RETURN 0;
  END IF;

  v_student_id := public.ensure_student_from_child_name(v_order.child_name);

  IF v_student_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_program_id IN
    SELECT DISTINCT cp.id
    FROM public.class_programs cp
    JOIN public.order_items oi ON oi.order_id = p_order_id
    WHERE coalesce(array_length(cp.source_product_names, 1), 0) > 0
      AND cp.end_date >= CURRENT_DATE
      AND public.program_matches_product_names(cp.source_product_names, oi.product_name)
  LOOP
    INSERT INTO public.student_enrollments (student_id, program_id)
    VALUES (v_student_id, v_program_id)
    ON CONFLICT (student_id, program_id) DO NOTHING;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
  END LOOP;

  RETURN v_total_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_order_item_auto_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  PERFORM public.auto_enroll_order_to_active_programs(NEW.order_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_order_auto_enrollment_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  PERFORM public.auto_enroll_order_to_active_programs(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_enroll_order_item_to_programs ON public.order_items;
CREATE TRIGGER auto_enroll_order_item_to_programs
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_item_auto_enrollment();

DROP TRIGGER IF EXISTS auto_enroll_order_updates_to_programs ON public.orders;
CREATE TRIGGER auto_enroll_order_updates_to_programs
AFTER UPDATE OF child_name, status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_auto_enrollment_updates();

REVOKE ALL ON FUNCTION public.normalize_student_program_text(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.program_matches_product_names(text[], text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_student_from_child_name(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_enroll_order_to_active_programs(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_order_item_auto_enrollment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_order_auto_enrollment_updates() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_program_enrollments(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_program_enrollments(uuid, text[]) TO authenticated;