
-- Table
CREATE TABLE public.student_checkinout (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  program_id uuid NOT NULL,
  student_id uuid NOT NULL,
  meeting_number integer NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('check_in','check_out')),
  event_time timestamptz NOT NULL DEFAULT now(),
  photo_url text,
  photo_storage text CHECK (photo_storage IN ('drive','supabase')),
  teacher_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX student_checkinout_unique_event
  ON public.student_checkinout (enrollment_id, meeting_number, event_type);

CREATE INDEX student_checkinout_program_idx ON public.student_checkinout (program_id);
CREATE INDEX student_checkinout_event_time_idx ON public.student_checkinout (event_time DESC);
CREATE INDEX student_checkinout_teacher_idx ON public.student_checkinout (teacher_email);

ALTER TABLE public.student_checkinout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and teacher can view checkinout"
ON public.student_checkinout FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_accounts
  WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin','teacher')
));

CREATE POLICY "Super admin and teacher can insert checkinout"
ON public.student_checkinout FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_accounts
  WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin','teacher')
));

CREATE POLICY "Super admin can update checkinout"
ON public.student_checkinout FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.admin_accounts
  WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role = 'super_admin'
));

CREATE POLICY "Super admin can delete checkinout"
ON public.student_checkinout FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.admin_accounts
  WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role = 'super_admin'
));

CREATE TRIGGER student_checkinout_set_updated_at
BEFORE UPDATE ON public.student_checkinout
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-mark attendance as present on check_in
CREATE OR REPLACE FUNCTION public.mark_attendance_on_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  existing_id uuid;
BEGIN
  IF NEW.event_type <> 'check_in' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO existing_id
  FROM public.student_attendance
  WHERE enrollment_id = NEW.enrollment_id
    AND meeting_number = NEW.meeting_number
    AND teacher_email = NEW.teacher_email
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE public.student_attendance
    SET attendance_status = 'present',
        updated_at = now()
    WHERE id = existing_id;
  ELSE
    INSERT INTO public.student_attendance (
      enrollment_id, meeting_number, date, attendance_status, teacher_email
    ) VALUES (
      NEW.enrollment_id, NEW.meeting_number,
      (NEW.event_time AT TIME ZONE 'UTC')::date,
      'present', NEW.teacher_email
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_attendance_on_checkin
AFTER INSERT ON public.student_checkinout
FOR EACH ROW EXECUTE FUNCTION public.mark_attendance_on_checkin();
