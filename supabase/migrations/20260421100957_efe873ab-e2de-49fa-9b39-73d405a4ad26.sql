CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'send-payment-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://wjfsfojfeyznnddxfspx.supabase.co/functions/v1/send-payment-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZnNmb2pmZXl6bm5kZHhmc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4OTQ3MzgsImV4cCI6MjA2MzQ3MDczOH0._JUOTDixaxMLhVkKKmSP7h3DyXdTBo-dvfEnsacKe4Q"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);