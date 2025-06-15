
-- TEMPORARY: Allow any authenticated user to insert into products for debugging ONLY
CREATE POLICY "TEMP: allow any authenticated insert" ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
