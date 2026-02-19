
-- 1. Add promo code constraints
ALTER TABLE public.promo_codes ADD CONSTRAINT code_length CHECK (length(code) <= 50);
ALTER TABLE public.promo_codes ADD CONSTRAINT code_format CHECK (code ~ '^[A-Z0-9]+$');

-- 2. Restrict storage uploads to admins only
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;

CREATE POLICY "Only admins can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images'
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE email = auth.email()
  )
);

-- 3. Create server-side promo code validation function
CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input text)
RETURNS TABLE(id uuid, code text, discount_percentage integer, is_valid boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT p.id, p.code, p.discount_percentage, true as is_valid
  FROM public.promo_codes p
  WHERE p.code = upper(trim(code_input))
    AND p.is_active = true
    AND (p.valid_from IS NULL OR p.valid_from <= now())
    AND (p.valid_until IS NULL OR p.valid_until >= now())
    AND (p.usage_limit IS NULL OR p.usage_count < p.usage_limit)
  LIMIT 1;
$$;

-- 4. Remove public SELECT policy on promo_codes
DROP POLICY IF EXISTS "Public can view active promo_codes" ON public.promo_codes;
