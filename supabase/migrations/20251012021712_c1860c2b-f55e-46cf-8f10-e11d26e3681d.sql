-- Allow public to view order items for recent guest orders (to show items on the Order Details page and WhatsApp message)
-- Mirrors the existing orders policy: public_can_select_recent_guest_orders

-- Create policy if not exists (idempotent: drop any existing with same name first)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'public_can_view_recent_guest_order_items'
  ) THEN
    EXECUTE 'DROP POLICY "public_can_view_recent_guest_order_items" ON public.order_items';
  END IF;
END $$;

CREATE POLICY "public_can_view_recent_guest_order_items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id IS NULL
      AND orders.created_at > (now() - interval '6 hours')
  )
);
