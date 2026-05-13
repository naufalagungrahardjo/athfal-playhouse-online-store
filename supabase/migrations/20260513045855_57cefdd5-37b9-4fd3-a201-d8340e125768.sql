CREATE OR REPLACE FUNCTION public.mark_attendance_on_checkin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  existing_id uuid;
  v_session_date date;
  v_meeting_number int;
BEGIN
  v_session_date := COALESCE(NEW.session_date, (NEW.event_time AT TIME ZONE 'UTC')::date);
  NEW.session_date := v_session_date;

  IF NEW.program_id IS NOT NULL THEN
    PERFORM public.ensure_program_session_date(NEW.program_id, v_session_date);
  END IF;

  -- Always auto-assign meeting_number based on session date so multiple sessions work
  v_meeting_number := COALESCE(NULLIF(NEW.meeting_number, 0), public.get_session_number(NEW.program_id, v_session_date));
  NEW.meeting_number := v_meeting_number;

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
      v_meeting_number,
      v_session_date,
      v_session_date,
      'present',
      NEW.teacher_email
    );
  END IF;

  RETURN NEW;
END;
$function$;