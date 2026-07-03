
CREATE TABLE public.backup_students_20260703 AS
SELECT * FROM public.students
WHERE id IN (
  '6939dcb2-ffe9-4f4c-84ca-cf82c5a6db9b',
  'af514ddd-8421-41fb-80d1-99ba7dfbb091',
  '46841eb1-8a53-4742-a3e0-66b84e754ee1',
  '3cf26870-0d9c-47ab-808c-48105ea69b56'
);

CREATE TABLE public.backup_enrollments_20260703 AS
SELECT * FROM public.student_enrollments
WHERE student_id IN (
  '6939dcb2-ffe9-4f4c-84ca-cf82c5a6db9b',
  'af514ddd-8421-41fb-80d1-99ba7dfbb091',
  '46841eb1-8a53-4742-a3e0-66b84e754ee1',
  '3cf26870-0d9c-47ab-808c-48105ea69b56'
);

CREATE TABLE public.backup_attendance_20260703 AS
SELECT a.* FROM public.student_attendance a
JOIN public.student_enrollments e ON e.id = a.enrollment_id
WHERE e.student_id IN (
  '6939dcb2-ffe9-4f4c-84ca-cf82c5a6db9b',
  'af514ddd-8421-41fb-80d1-99ba7dfbb091',
  '46841eb1-8a53-4742-a3e0-66b84e754ee1',
  '3cf26870-0d9c-47ab-808c-48105ea69b56'
);

CREATE TABLE public.backup_checkinout_20260703 AS
SELECT c.* FROM public.student_checkinout c
JOIN public.student_enrollments e ON e.id = c.enrollment_id
WHERE e.student_id IN (
  '6939dcb2-ffe9-4f4c-84ca-cf82c5a6db9b',
  'af514ddd-8421-41fb-80d1-99ba7dfbb091',
  '46841eb1-8a53-4742-a3e0-66b84e754ee1',
  '3cf26870-0d9c-47ab-808c-48105ea69b56'
);

CREATE TABLE public.backup_final_reports_20260703 AS
SELECT * FROM public.student_final_reports
WHERE student_id IN (
  '6939dcb2-ffe9-4f4c-84ca-cf82c5a6db9b',
  'af514ddd-8421-41fb-80d1-99ba7dfbb091',
  '46841eb1-8a53-4742-a3e0-66b84e754ee1',
  '3cf26870-0d9c-47ab-808c-48105ea69b56'
);
