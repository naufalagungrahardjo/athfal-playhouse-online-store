-- Remove duplicate teacher_attendance rows (keep earliest per teacher_email+date, merging leave_time if any)
WITH ranked AS (
  SELECT id, teacher_email, date,
         ROW_NUMBER() OVER (PARTITION BY teacher_email, date ORDER BY arrival_time NULLS LAST, created_at) AS rn
  FROM public.teacher_attendance
),
to_keep AS (SELECT teacher_email, date, id FROM ranked WHERE rn = 1),
merged AS (
  SELECT k.id AS keep_id,
         MAX(t.leave_time) AS leave_time,
         MAX(t.evidence_url) AS evidence_url,
         MAX(t.remarks) AS remarks
  FROM to_keep k
  JOIN public.teacher_attendance t
    ON t.teacher_email = k.teacher_email AND t.date = k.date
  GROUP BY k.id
)
UPDATE public.teacher_attendance ta
SET leave_time = COALESCE(ta.leave_time, m.leave_time),
    evidence_url = COALESCE(ta.evidence_url, m.evidence_url),
    remarks = COALESCE(ta.remarks, m.remarks),
    updated_at = now()
FROM merged m
WHERE ta.id = m.keep_id;

DELETE FROM public.teacher_attendance
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY teacher_email, date ORDER BY arrival_time NULLS LAST, created_at) AS rn
    FROM public.teacher_attendance
  ) x WHERE rn > 1
);

-- Prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS teacher_attendance_unique_per_day
  ON public.teacher_attendance (teacher_email, date);