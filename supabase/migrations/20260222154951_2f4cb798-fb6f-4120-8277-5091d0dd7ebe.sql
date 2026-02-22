
-- Drop the overly permissive public policies
DROP POLICY IF EXISTS "Allow all users to read active promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow all users to increment promo usage count" ON public.promo_codes;
DROP POLICY IF EXISTS "Allow public to increment promo usage" ON public.promo_codes;

-- Create a secure RPC function to atomically increment promo usage
-- This replaces the direct UPDATE from the client
CREATE OR REPLACE FUNCTION public.increment_promo_usage(promo_id uuid, expected_count integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE public.promo_codes
  SET usage_count = expected_count + 1, updated_at = now()
  WHERE id = promo_id
    AND usage_count = expected_count
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
    AND (usage_limit IS NULL OR usage_count < usage_limit);

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;
