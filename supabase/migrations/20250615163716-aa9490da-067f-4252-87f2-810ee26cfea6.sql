
-- Remove the temporary insert policy for products
DROP POLICY IF EXISTS "TEMP: allow any authenticated insert" ON public.products;

-- TEMP: Allow any authenticated user to SELECT all products (for debugging only)
CREATE POLICY "TEMP: allow any authenticated select" ON public.products
  FOR SELECT
  TO authenticated
  USING (true);
