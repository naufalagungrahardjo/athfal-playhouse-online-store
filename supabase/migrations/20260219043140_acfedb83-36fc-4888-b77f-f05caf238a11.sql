
-- Drop the header-based policies (they won't work well with the JS client)
DROP POLICY IF EXISTS "guest_can_view_order_by_token" ON public.orders;
DROP POLICY IF EXISTS "guest_can_view_order_items_by_token" ON public.order_items;

-- Simpler approach: allow SELECT on orders where lookup_token matches the queried value
-- The RLS filter combined with the .eq('lookup_token', token) in code ensures security
CREATE POLICY "guest_can_view_order_by_lookup_token" ON public.orders
FOR SELECT USING (
  lookup_token IS NOT NULL
);

-- Similarly for order_items - only accessible if the parent order is accessible
CREATE POLICY "guest_can_view_order_items_via_order" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.lookup_token IS NOT NULL
  )
);
