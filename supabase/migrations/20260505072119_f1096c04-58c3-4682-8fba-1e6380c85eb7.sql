-- Helper: is the email a non-teacher admin account?
CREATE OR REPLACE FUNCTION public.is_non_teacher_admin(email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = $1 AND a.role <> 'teacher'
  );
$$;

-- parent_messages: replace SELECT and UPDATE policies
DROP POLICY IF EXISTS "View threads: owner or staff" ON public.parent_messages;
DROP POLICY IF EXISTS "Update threads: owner or staff" ON public.parent_messages;

CREATE POLICY "View threads: owner, admin, or assigned teacher"
ON public.parent_messages
FOR SELECT
USING (
  parent_user_id = auth.uid()
  OR public.is_non_teacher_admin(auth.email())
  OR (recipient_teacher_email IS NOT NULL AND lower(recipient_teacher_email) = lower(auth.email()))
);

CREATE POLICY "Update threads: owner, admin, or assigned teacher"
ON public.parent_messages
FOR UPDATE
USING (
  parent_user_id = auth.uid()
  OR public.is_non_teacher_admin(auth.email())
  OR (recipient_teacher_email IS NOT NULL AND lower(recipient_teacher_email) = lower(auth.email()))
);

-- parent_message_replies: restrict view/insert similarly
DROP POLICY IF EXISTS "View replies: thread participant or staff" ON public.parent_message_replies;
DROP POLICY IF EXISTS "Insert replies: parent owner or staff" ON public.parent_message_replies;

CREATE POLICY "View replies: participant, admin, or assigned teacher"
ON public.parent_message_replies
FOR SELECT
USING (
  public.is_non_teacher_admin(auth.email())
  OR EXISTS (
    SELECT 1 FROM public.parent_messages t
    WHERE t.id = parent_message_replies.thread_id
      AND (
        t.parent_user_id = auth.uid()
        OR (t.recipient_teacher_email IS NOT NULL AND lower(t.recipient_teacher_email) = lower(auth.email()))
      )
  )
);

CREATE POLICY "Insert replies: participant, admin, or assigned teacher"
ON public.parent_message_replies
FOR INSERT
WITH CHECK (
  lower(sender_email) = lower(auth.email())
  AND (
    public.is_non_teacher_admin(auth.email())
    OR EXISTS (
      SELECT 1 FROM public.parent_messages t
      WHERE t.id = parent_message_replies.thread_id
        AND (
          t.parent_user_id = auth.uid()
          OR (t.recipient_teacher_email IS NOT NULL AND lower(t.recipient_teacher_email) = lower(auth.email()))
        )
    )
  )
);