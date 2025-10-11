-- Fix checkout failure: orders.user_id FK points to a table that may not contain the auth user yet
-- Drop the problematic foreign key and add an index for performant lookups

BEGIN;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Optional but recommended: index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

COMMIT;