-- 1. New table to track which dates each program actually met
CREATE TABLE IF NOT EXISTS public.program_session_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  session_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (program_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_program_session_dates_program_date
  ON public.program_session_dates (program_id, session_date);

ALTER TABLE public.program_session_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers and super_admin can view program session dates" ON public.program_session_dates;
CREATE POLICY "Teachers and super_admin can view program session dates"
  ON public.program_session_dates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email()
      AND role IN ('super_admin', 'teacher')
  ));

DROP POLICY IF EXISTS "Teachers and super_admin can insert program session dates" ON public.program_session_dates;
CREATE POLICY "Teachers and super_admin can insert program session dates"
  ON public.program_session_dates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email()
      AND role IN ('super_admin', 'teacher')
  ));

DROP POLICY IF EXISTS "Super admin can delete program session dates" ON public.program_session_dates;
CREATE POLICY "Super admin can delete program session dates"
  ON public.program_session_dates FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email()
      AND role = 'super_admin'
  ));

-- 2. Add session_date columns
ALTER TABLE public.student_attendance
  ADD COLUMN IF NOT EXISTS session_date date;

ALTER TABLE public.student_checkinout
  ADD COLUMN IF NOT EXISTS session_date date;

UPDATE public.student_attendance
  SET session_date = date
  WHERE session_date IS NULL AND date IS NOT NULL;

UPDATE public.student_checkinout
  SET session_date = (event_time AT TIME ZONE 'UTC')::date
  WHERE session_date IS NULL AND event_time IS NOT NULL;

INSERT INTO public.program_session_dates (program_id, session_date)
SELECT DISTINCT c.program_id, c.session_date
FROM public.student_checkinout c
WHERE c.program_id IS NOT NULL AND c.session_date IS NOT NULL
ON CONFLICT (program_id, session_date) DO NOTHING;

INSERT INTO public.program_session_dates (program_id, session_date)
SELECT DISTINCT se.program_id, sa.session_date
FROM public.student_attendance sa
JOIN public.student_enrollments se ON se.id = sa.enrollment_id
WHERE sa.session_date IS NOT NULL
ON CONFLICT (program_id, session_date) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_student_attendance_session_date
  ON public.student_attendance (enrollment_id, session_date);

CREATE INDEX IF NOT EXISTS idx_student_checkinout_session_date
  ON public.student_checkinout (program_id, session_date);

-- 3. Session number = chronological order of date among that program's distinct dates
CREATE OR REPLACE FUNCTION public.get_session_number(p_program_id uuid, p_session_date date)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT COUNT(*)::int
     FROM public.program_session_dates psd
     WHERE psd.program_id = p_program_id
       AND psd.session_date <= p_session_date),
    0
  );
$$;

-- 4. Idempotent ensure
CREATE OR REPLACE FUNCTION public.ensure_program_session_date(p_program_id uuid, p_session_date date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_program_id IS NULL OR p_session_date IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_id
    FROM public.program_session_dates
   WHERE program_id = p_program_id AND session_date = p_session_date
   LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.program_session_dates (program_id, session_date)
    VALUES (p_program_id, p_session_date)
    ON CONFLICT (program_id, session_date) DO NOTHING
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      SELECT id INTO v_id FROM public.program_session_dates
       WHERE program_id = p_program_id AND session_date = p_session_date
       LIMIT 1;
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

-- 5. Manual add (for "+ Add date" button)
CREATE OR REPLACE FUNCTION public.add_program_session_date(p_program_id uuid, p_session_date date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email()
      AND role IN ('super_admin', 'teacher')
  ) THEN
    RAISE EXCEPTION 'Not authorized to add session dates';
  END IF;

  v_id := public.ensure_program_session_date(p_program_id, p_session_date);
  RETURN v_id;
END;
$$;

-- 6. Updated check-in trigger keyed on session_date
CREATE OR REPLACE FUNCTION public.mark_attendance_on_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  existing_id uuid;
  v_session_date date;
BEGIN
  v_session_date := COALESCE(NEW.session_date, (NEW.event_time AT TIME ZONE 'UTC')::date);
  NEW.session_date := v_session_date;

  IF NEW.program_id IS NOT NULL THEN
    PERFORM public.ensure_program_session_date(NEW.program_id, v_session_date);
  END IF;

  IF NEW.event_type <> 'check_in' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO existing_id
  FROM public.student_attendance
  WHERE enrollment_id = NEW.enrollment_id
    AND session_date = v_session_date
    AND teacher_email = NEW.teacher_email
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.student_attendance
    SET attendance_status = 'present',
        date = v_session_date,
        updated_at = now()
    WHERE id = existing_id;
  ELSE
    INSERT INTO public.student_attendance (
      enrollment_id, meeting_number, date, session_date, attendance_status, teacher_email
    ) VALUES (
      NEW.enrollment_id,
      COALESCE(NEW.meeting_number, public.get_session_number(NEW.program_id, v_session_date)),
      v_session_date,
      v_session_date,
      'present',
      NEW.teacher_email
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_attendance_on_checkin_trigger ON public.student_checkinout;
CREATE TRIGGER mark_attendance_on_checkin_trigger
BEFORE INSERT ON public.student_checkinout
FOR EACH ROW EXECUTE FUNCTION public.mark_attendance_on_checkin();

-- 7. Drop & recreate get_my_child_attendance with new session_date column
DROP FUNCTION IF EXISTS public.get_my_child_attendance();

CREATE OR REPLACE FUNCTION public.get_my_child_attendance()
RETURNS TABLE(
  record_kind text, record_id uuid, student_id uuid, student_name text,
  program_id uuid, program_name text, meeting_number integer,
  event_type text, event_time timestamp with time zone, photo_url text,
  attendance_status text, attendance_date date, teacher_email text,
  session_date date
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH my_email AS (
    SELECT lower(auth.email()) AS email
  ),
  my_children AS (
    SELECT DISTINCT s.id AS student_id, s.name AS student_name
    FROM public.orders o
    JOIN public.students s
      ON public.normalize_student_program_text(s.name)
       = public.normalize_student_program_text(o.child_name)
    WHERE lower(o.customer_email) = (SELECT email FROM my_email)
      AND o.status <> 'cancelled'
      AND trim(coalesce(o.child_name, '')) <> ''
  )
  SELECT
    'checkinout'::text,
    c.id, c.student_id, mc.student_name, c.program_id, cp.name,
    c.meeting_number, c.event_type, c.event_time, c.photo_url,
    NULL::text, NULL::date, c.teacher_email,
    COALESCE(c.session_date, (c.event_time AT TIME ZONE 'UTC')::date)
  FROM public.student_checkinout c
  JOIN my_children mc ON mc.student_id = c.student_id
  LEFT JOIN public.class_programs cp ON cp.id = c.program_id

  UNION ALL

  SELECT
    'attendance'::text,
    a.id, se.student_id, mc.student_name, se.program_id, cp.name,
    a.meeting_number, NULL::text, NULL::timestamptz, NULL::text,
    a.attendance_status, a.date, a.teacher_email,
    COALESCE(a.session_date, a.date)
  FROM public.student_attendance a
  JOIN public.student_enrollments se ON se.id = a.enrollment_id
  JOIN my_children mc ON mc.student_id = se.student_id
  LEFT JOIN public.class_programs cp ON cp.id = se.program_id

  ORDER BY 9 DESC NULLS LAST, 12 DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.add_program_session_date(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_session_number(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_program_session_date(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_child_attendance() TO authenticated;