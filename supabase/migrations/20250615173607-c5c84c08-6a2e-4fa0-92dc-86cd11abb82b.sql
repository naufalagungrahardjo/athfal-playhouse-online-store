
-- Allow anyone (including unauthenticated/public users) to create an order for guest checkout
CREATE POLICY "Anyone can insert orders for guest checkout"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Optionally, you may want a similar policy for SELECT if public users need to see their order (order confirmation page)
-- Uncomment if you want this:
-- CREATE POLICY "Anyone can select orders for confirmation" 
--   ON public.orders
--   FOR SELECT
--   USING (true);
