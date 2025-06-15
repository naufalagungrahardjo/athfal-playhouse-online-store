
-- Allow anyone (including the public/anonymous users) to SELECT (view) products
CREATE POLICY "Public can view products" ON public.products
  FOR SELECT
  USING (true);
