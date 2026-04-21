ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS amount_paid integer NOT NULL DEFAULT 0;

-- Backfill: assume completed orders were fully paid historically
UPDATE public.orders
SET amount_paid = total_amount
WHERE status = 'completed' AND amount_paid = 0;