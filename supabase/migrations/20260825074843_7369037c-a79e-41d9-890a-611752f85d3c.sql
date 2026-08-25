CREATE TABLE public.billing_reminder_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid,
  notice_id uuid,
  order_id uuid,
  recipient_email text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.billing_reminder_logs TO authenticated;
GRANT ALL ON public.billing_reminder_logs TO service_role;

ALTER TABLE public.billing_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view billing reminder logs"
ON public.billing_reminder_logs
FOR SELECT
TO authenticated
USING (public.is_admin_account_ci());

CREATE INDEX idx_billing_reminder_logs_assignment ON public.billing_reminder_logs (assignment_id, sent_at DESC);
CREATE INDEX idx_billing_reminder_logs_notice ON public.billing_reminder_logs (notice_id, sent_at DESC);