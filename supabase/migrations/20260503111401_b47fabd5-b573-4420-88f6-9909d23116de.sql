
ALTER TABLE public.billing_notice_assignments
  ADD COLUMN IF NOT EXISTS email_reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_reminder_sent_at timestamptz;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'send-billing-reminders-daily';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END $$;

SELECT cron.schedule(
  'send-billing-reminders-daily',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://wjfsfojfeyznnddxfspx.supabase.co/functions/v1/send-billing-reminders',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZnNmb2pmZXl6bm5kZHhmc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4OTQ3MzgsImV4cCI6MjA2MzQ3MDczOH0._JUOTDixaxMLhVkKKmSP7h3DyXdTBo-dvfEnsacKe4Q"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
