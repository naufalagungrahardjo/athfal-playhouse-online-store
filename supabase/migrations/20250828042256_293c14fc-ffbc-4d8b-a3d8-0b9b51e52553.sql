-- Allow selecting newly-inserted guest orders (needed for INSERT ... RETURNING)
-- Without this, anon inserts succeed but fail on RETURNING due to SELECT RLS
CREATE POLICY "public_can_select_recent_guest_orders"
ON public.orders
FOR SELECT
USING (
  user_id IS NULL
  AND created_at > now() - interval '6 hours'
);

-- Final comprehensive grants to ensure anon can perform checkout
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.order_items TO anon;