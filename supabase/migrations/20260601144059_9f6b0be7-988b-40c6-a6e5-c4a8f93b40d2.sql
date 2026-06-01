CREATE TABLE IF NOT EXISTS public.cron_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cron_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cron_secrets FROM anon, authenticated;
GRANT ALL ON public.cron_secrets TO service_role;

INSERT INTO public.cron_secrets (name, secret)
VALUES ('send-billing-reminders', 'de7187f9dacdae3f64284662fb37cb6075cb44c5ab642d19dfc49237a8347e93')
ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret;

SELECT cron.unschedule('send-billing-reminders-every-5-min');

SELECT cron.schedule(
  'send-billing-reminders-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wjfsfojfeyznnddxfspx.supabase.co/functions/v1/send-billing-reminders',
    headers := '{"Content-Type":"application/json","x-cron-secret":"de7187f9dacdae3f64284662fb37cb6075cb44c5ab642d19dfc49237a8347e93"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);