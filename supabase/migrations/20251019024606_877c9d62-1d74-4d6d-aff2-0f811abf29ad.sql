-- Allow anyone to increment promo code usage count
-- This policy allows updating ONLY the usage_count field by incrementing it by 1
-- All other fields must remain unchanged
CREATE POLICY "Allow incrementing promo code usage"
ON public.promo_codes
FOR UPDATE
TO public
USING (
  is_active = true
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until >= now())
)
WITH CHECK (
  -- Only usage_count can change, and only by +1
  code = (SELECT code FROM public.promo_codes WHERE id = promo_codes.id) AND
  discount_percentage = (SELECT discount_percentage FROM public.promo_codes WHERE id = promo_codes.id) AND
  description IS NOT DISTINCT FROM (SELECT description FROM public.promo_codes WHERE id = promo_codes.id) AND
  is_active = (SELECT is_active FROM public.promo_codes WHERE id = promo_codes.id) AND
  valid_from IS NOT DISTINCT FROM (SELECT valid_from FROM public.promo_codes WHERE id = promo_codes.id) AND
  valid_until IS NOT DISTINCT FROM (SELECT valid_until FROM public.promo_codes WHERE id = promo_codes.id) AND
  usage_limit IS NOT DISTINCT FROM (SELECT usage_limit FROM public.promo_codes WHERE id = promo_codes.id) AND
  usage_count = (SELECT usage_count FROM public.promo_codes WHERE id = promo_codes.id) + 1
);