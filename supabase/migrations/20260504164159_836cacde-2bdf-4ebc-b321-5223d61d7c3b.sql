
-- Add teacher name column for display
ALTER TABLE public.parent_messages
  ADD COLUMN IF NOT EXISTS recipient_teacher_name text;

-- Backfill from admin_accounts + users
UPDATE public.parent_messages pm
SET recipient_teacher_name = COALESCE(NULLIF(trim(u.name), ''), a.email)
FROM public.admin_accounts a
LEFT JOIN public.users u ON u.email = a.email
WHERE pm.recipient_teacher_email IS NOT NULL
  AND a.email = pm.recipient_teacher_email
  AND pm.recipient_teacher_name IS NULL;

-- Replace RLS policies on parent_messages to use SECURITY DEFINER admin check
DROP POLICY IF EXISTS "View threads: owner or staff" ON public.parent_messages;
DROP POLICY IF EXISTS "Update threads: owner or staff" ON public.parent_messages;

CREATE POLICY "View threads: owner or staff"
  ON public.parent_messages FOR SELECT
  USING (
    parent_user_id = auth.uid()
    OR public.is_admin_account(auth.email())
  );

CREATE POLICY "Update threads: owner or staff"
  ON public.parent_messages FOR UPDATE
  USING (
    parent_user_id = auth.uid()
    OR public.is_admin_account(auth.email())
  );

-- Replace RLS policies on parent_message_replies similarly
DROP POLICY IF EXISTS "View replies: thread participant or staff" ON public.parent_message_replies;
DROP POLICY IF EXISTS "Insert replies: parent owner or staff" ON public.parent_message_replies;

CREATE POLICY "View replies: thread participant or staff"
  ON public.parent_message_replies FOR SELECT
  USING (
    public.is_admin_account(auth.email())
    OR EXISTS (
      SELECT 1 FROM public.parent_messages t
      WHERE t.id = thread_id AND t.parent_user_id = auth.uid()
    )
  );

CREATE POLICY "Insert replies: parent owner or staff"
  ON public.parent_message_replies FOR INSERT
  WITH CHECK (
    lower(sender_email) = lower(auth.email())
    AND (
      public.is_admin_account(auth.email())
      OR EXISTS (
        SELECT 1 FROM public.parent_messages t
        WHERE t.id = thread_id AND t.parent_user_id = auth.uid()
      )
    )
  );
