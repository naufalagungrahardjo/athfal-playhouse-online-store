CREATE OR REPLACE FUNCTION public.validate_promo_code(code_input text)
 RETURNS TABLE(id uuid, code text, discount_percentage integer, discount_type text, discount_amount integer, is_valid boolean, applies_to text, applicable_product_ids text[], applicable_category_slugs text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT p.id, p.code, p.discount_percentage, p.discount_type, p.discount_amount, true as is_valid,
         p.applies_to, p.applicable_product_ids, p.applicable_category_slugs
  FROM public.promo_codes p
  WHERE p.code = upper(trim(code_input))
    AND p.is_active = true
    AND (p.valid_from IS NULL OR p.valid_from <= now())
    AND (p.valid_until IS NULL OR p.valid_until >= now())
    AND (p.usage_limit IS NULL OR p.usage_limit <= 0 OR p.usage_count < p.usage_limit)
  LIMIT 1;
$function$;