
CREATE OR REPLACE FUNCTION public.get_my_child_attendance()
RETURNS TABLE (
  record_kind text,           -- 'checkinout' | 'attendance'
  record_id uuid,
  student_id uuid,
  student_name text,
  program_id uuid,
  program_name text,
  meeting_number integer,
  event_type text,            -- 'check_in' | 'check_out' | NULL
  event_time timestamptz,
  photo_url text,
  attendance_status text,
  attendance_date date,
  teacher_email text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  WITH my_email AS (
    SELECT lower(auth.email()) AS email
  ),
  my_children AS (
    -- Distinct student ids belonging to this parent's orders
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
    'checkinout'::text AS record_kind,
    c.id AS record_id,
    c.student_id,
    mc.student_name,
    c.program_id,
    cp.name AS program_name,
    c.meeting_number,
    c.event_type,
    c.event_time,
    c.photo_url,
    NULL::text AS attendance_status,
    NULL::date AS attendance_date,
    c.teacher_email
  FROM public.student_checkinout c
  JOIN my_children mc ON mc.student_id = c.student_id
  LEFT JOIN public.class_programs cp ON cp.id = c.program_id

  UNION ALL

  SELECT
    'attendance'::text AS record_kind,
    a.id AS record_id,
    se.student_id,
    mc.student_name,
    se.program_id,
    cp.name AS program_name,
    a.meeting_number,
    NULL::text AS event_type,
    NULL::timestamptz AS event_time,
    NULL::text AS photo_url,
    a.attendance_status,
    a.date AS attendance_date,
    a.teacher_email
  FROM public.student_attendance a
  JOIN public.student_enrollments se ON se.id = a.enrollment_id
  JOIN my_children mc ON mc.student_id = se.student_id
  LEFT JOIN public.class_programs cp ON cp.id = se.program_id

  ORDER BY 9 DESC NULLS LAST, 12 DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_child_attendance() TO authenticated;
