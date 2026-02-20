
-- Allow anonymous and authenticated users to read active promo codes
CREATE POLICY "Allow all users to read active promo codes"
ON public.promo_codes FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anonymous and authenticated users to update usage_count on promo codes
CREATE POLICY "Allow all users to increment promo usage count"
ON public.promo_codes FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
