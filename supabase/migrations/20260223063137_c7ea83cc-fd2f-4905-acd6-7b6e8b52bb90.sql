
CREATE OR REPLACE FUNCTION public.increment_promo_usage_by_code(promo_code_value text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE public.promo_codes
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE code = upper(trim(promo_code_value))
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
    AND (usage_limit IS NULL OR usage_count < usage_limit);

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;
