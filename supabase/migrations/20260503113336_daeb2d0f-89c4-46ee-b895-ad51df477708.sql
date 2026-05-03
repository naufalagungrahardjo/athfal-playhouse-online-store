ALTER TABLE public.billing_notices
  ADD COLUMN IF NOT EXISTS due_at timestamptz;

-- Backfill due_at from existing due_date at 06:00 Asia/Jakarta
UPDATE public.billing_notices
SET due_at = (due_date::text || ' 06:00:00')::timestamp AT TIME ZONE 'Asia/Jakarta'
WHERE due_at IS NULL AND due_date IS NOT NULL;

-- Reschedule cron: remove daily job, add every-5-minutes job
DO $$
DECLARE
  jid bigint;
BEGIN
  FOR jid IN SELECT jobid FROM cron.job WHERE jobname IN ('send-billing-reminders-daily', 'send-billing-reminders-every-5-min')
  LOOP
    PERFORM cron.unschedule(jid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'send-billing-reminders-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wjfsfojfeyznnddxfspx.supabase.co/functions/v1/send-billing-reminders',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZnNmb2pmZXl6bm5kZHhmc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4OTQ3MzgsImV4cCI6MjA2MzQ3MDczOH0._JUOTDixaxMLhVkKKmSP7h3DyXdTBo-dvfEnsacKe4Q"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);