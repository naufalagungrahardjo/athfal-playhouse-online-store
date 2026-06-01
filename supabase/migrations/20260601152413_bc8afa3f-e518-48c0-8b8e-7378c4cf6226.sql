-- Add a separate column for when the reminder email should be sent,
-- decoupled from the billing due date.
ALTER TABLE public.billing_notices
  ADD COLUMN IF NOT EXISTS send_at timestamp with time zone;

-- Backfill existing notices: use the previously combined due_at (send moment)
-- as the send time so behavior is preserved.
UPDATE public.billing_notices
SET send_at = COALESCE(due_at, (due_date::timestamp AT TIME ZONE 'Asia/Jakarta'))
WHERE send_at IS NULL;