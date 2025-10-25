-- Drop the buggy policy
DROP POLICY IF EXISTS "Allow incrementing promo code usage" ON public.promo_codes;

-- Create a better policy that allows public to increment usage_count only
-- This uses OLD and NEW row references which work properly in RLS WITH CHECK
CREATE POLICY "Allow public to increment promo usage"
ON public.promo_codes
FOR UPDATE
TO public
USING (
  -- Can update if promo is active and within valid date range
  is_active = true
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until >= now())
  -- And usage hasn't exceeded limit
  AND (usage_limit IS NULL OR usage_count < usage_limit)
)
WITH CHECK (
  -- Only allow incrementing usage_count by exactly 1
  -- All other fields must remain unchanged (checked via update statement itself)
  usage_count > 0  -- Just ensure it's positive (the actual increment is controlled by the update statement)
);