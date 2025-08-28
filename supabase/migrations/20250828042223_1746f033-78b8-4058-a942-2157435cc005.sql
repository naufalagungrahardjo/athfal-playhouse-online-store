-- Allow selecting newly-inserted guest orders (needed for INSERT ... RETURNING)
-- Without this, anon inserts succeed but fail on RETURNING due to SELECT RLS
CREATE POLICY IF NOT EXISTS "public_can_select_recent_guest_orders"
ON public.orders
FOR SELECT
USING (
  user_id IS NULL
  AND created_at > now() - interval '6 hours'
);

-- Re-affirm privileges (idempotent if already granted)
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.orders TO authenticated;
