
-- Parent message threads
CREATE TABLE public.parent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid,
  parent_email text NOT NULL,
  parent_name text,
  recipient_teacher_email text,
  message_type text NOT NULL CHECK (message_type IN ('Request','Concern','Compliment')),
  topic text NOT NULL CHECK (topic IN ('Admin','Attendance','Health & Care','Safety & Security','Learning','Fee','Others')),
  subject text NOT NULL,
  body text NOT NULL,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_parent_messages_parent_email ON public.parent_messages(parent_email);
CREATE INDEX idx_parent_messages_recipient ON public.parent_messages(recipient_teacher_email);
CREATE INDEX idx_parent_messages_last_activity ON public.parent_messages(last_activity_at DESC);

ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;

-- Helper predicate: is current user any admin/teacher
-- (Inline EXISTS used in policies below)

-- INSERT: parent creates own thread
CREATE POLICY "Parents can create own threads"
  ON public.parent_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND parent_user_id = auth.uid()
    AND lower(parent_email) = lower(auth.email())
  );

-- SELECT: parent owns it OR any admin/teacher
CREATE POLICY "View threads: owner or staff"
  ON public.parent_messages FOR SELECT
  USING (
    parent_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email())
  );

-- UPDATE: staff can update last_activity (we'll mostly do via trigger), parent owner too
CREATE POLICY "Update threads: owner or staff"
  ON public.parent_messages FOR UPDATE
  USING (
    parent_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email())
  );

-- DELETE: super_admin only
CREATE POLICY "Delete threads: super_admin"
  ON public.parent_messages FOR DELETE
  USING (is_super_admin(auth.email()));

-- Replies
CREATE TABLE public.parent_message_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.parent_messages(id) ON DELETE CASCADE,
  sender_email text NOT NULL,
  sender_name text,
  sender_role text NOT NULL CHECK (sender_role IN ('parent','admin','teacher','super_admin','content_manager','content_staff','orders_manager','order_staff')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_parent_message_replies_thread ON public.parent_message_replies(thread_id, created_at);

ALTER TABLE public.parent_message_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View replies: thread participant or staff"
  ON public.parent_message_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_messages t
      WHERE t.id = thread_id
        AND (
          t.parent_user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email())
        )
    )
  );

CREATE POLICY "Insert replies: parent owner or staff"
  ON public.parent_message_replies FOR INSERT
  WITH CHECK (
    lower(sender_email) = lower(auth.email())
    AND EXISTS (
      SELECT 1 FROM public.parent_messages t
      WHERE t.id = thread_id
        AND (
          t.parent_user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email())
        )
    )
  );

CREATE POLICY "Delete replies: super_admin"
  ON public.parent_message_replies FOR DELETE
  USING (is_super_admin(auth.email()));

-- Trigger: update thread last_activity_at on new reply
CREATE OR REPLACE FUNCTION public.bump_parent_message_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.parent_messages
    SET last_activity_at = now(), updated_at = now()
    WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_parent_message_activity
AFTER INSERT ON public.parent_message_replies
FOR EACH ROW EXECUTE FUNCTION public.bump_parent_message_activity();

-- Read tracking
CREATE TABLE public.parent_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.parent_messages(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_email)
);

ALTER TABLE public.parent_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage own read state"
  ON public.parent_message_reads FOR ALL
  USING (lower(user_email) = lower(auth.email()))
  WITH CHECK (lower(user_email) = lower(auth.email()));

-- Helper: list teacher emails for parent recipient picker
CREATE OR REPLACE FUNCTION public.list_teacher_recipients()
RETURNS TABLE(email text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT email FROM public.admin_accounts WHERE role = 'teacher' ORDER BY email;
$$;

GRANT EXECUTE ON FUNCTION public.list_teacher_recipients() TO authenticated;
