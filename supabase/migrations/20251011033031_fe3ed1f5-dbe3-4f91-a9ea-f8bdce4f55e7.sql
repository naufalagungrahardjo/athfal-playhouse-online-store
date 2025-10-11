-- Add a flag to ensure stock is only deducted once per order
BEGIN;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;
COMMIT;