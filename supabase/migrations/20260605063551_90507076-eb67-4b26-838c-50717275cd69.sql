-- 1. Add nominal discount support to promo_codes
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_amount integer NOT NULL DEFAULT 0;

ALTER TABLE public.promo_codes ALTER COLUMN discount_percentage SET DEFAULT 0;

ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_percentage_check;

ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_type_check;
ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_type_check CHECK (discount_type IN ('percentage', 'fixed'));
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_percentage_range;
ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_percentage_range CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_amount_nonneg;
ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_amount_nonneg CHECK (discount_amount >= 0);

-- 2. Recreate validate_promo_code with new return columns
DROP FUNCTION IF EXISTS public.validate_promo_code(text);
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
    AND (p.usage_limit IS NULL OR p.usage_count < p.usage_limit)
  LIMIT 1;
$function$;

-- 3. Update payment division setup: FIXED discount reduces only the first payment.
CREATE OR REPLACE FUNCTION public.setup_order_payments_for_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
  v_base_id text;
  v_variant_marker text;
  v_variant_id uuid;
  v_divisions jsonb;
  v_div_count int;
  v_amount integer;
  v_idx int;
  v_payment_number int := 0;
  v_subtotal integer;
  v_discount integer;
  v_ratio numeric := 0;
  v_promo_code text;
  v_disc_type text := 'percentage';
  v_fixed_remaining integer := 0;
BEGIN
  DELETE FROM public.order_payments WHERE order_id = p_order_id;

  SELECT COALESCE(subtotal, 0), COALESCE(discount_amount, 0), promo_code
    INTO v_subtotal, v_discount, v_promo_code
  FROM public.orders
  WHERE id = p_order_id;

  IF v_promo_code IS NOT NULL THEN
    SELECT pc.discount_type INTO v_disc_type
    FROM public.promo_codes pc
    WHERE pc.code = upper(trim(v_promo_code))
    LIMIT 1;
    v_disc_type := COALESCE(v_disc_type, 'percentage');
  END IF;

  IF v_disc_type = 'fixed' THEN
    v_ratio := 0;
    v_fixed_remaining := COALESCE(v_discount, 0);
  ELSE
    IF v_subtotal > 0 AND v_discount > 0 THEN
      v_ratio := v_discount::numeric / v_subtotal::numeric;
      IF v_ratio < 0 THEN v_ratio := 0; END IF;
      IF v_ratio > 1 THEN v_ratio := 1; END IF;
    END IF;
  END IF;

  FOR rec IN
    SELECT product_id, product_name, product_price, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
    ORDER BY created_at ASC NULLS LAST
  LOOP
    v_variant_id := NULL;
    v_divisions := NULL;

    IF position('__variant_' in rec.product_id) > 0 THEN
      v_base_id := split_part(rec.product_id, '__', 1);
      v_variant_marker := split_part(rec.product_id, '__', 2);
      BEGIN
        v_variant_id := substring(v_variant_marker from 9)::uuid;
      EXCEPTION WHEN others THEN
        v_variant_id := NULL;
      END;

      IF v_variant_id IS NOT NULL THEN
        SELECT price_divisions INTO v_divisions
        FROM public.product_variants
        WHERE id = v_variant_id;
      END IF;
    END IF;

    v_div_count := COALESCE(jsonb_array_length(v_divisions), 0);

    IF v_div_count >= 1 THEN
      FOR v_idx IN 0..(v_div_count - 1) LOOP
        v_amount := ROUND(COALESCE((v_divisions->>v_idx)::numeric, 0) * rec.quantity * (1 - v_ratio));
        v_payment_number := v_payment_number + 1;

        IF v_payment_number = 1 AND v_fixed_remaining > 0 THEN
          v_amount := GREATEST(0, v_amount - v_fixed_remaining);
        END IF;

        INSERT INTO public.order_payments (
          order_id, payment_number, amount, status, paid_at, notes
        ) VALUES (
          p_order_id,
          v_payment_number,
          v_amount,
          CASE WHEN v_idx = 0 THEN 'paid' ELSE 'unpaid' END,
          CASE WHEN v_idx = 0 THEN now() ELSE NULL END,
          rec.product_name || ' - Pembayaran ' || (v_idx + 1)::text
        );
      END LOOP;
    ELSE
      v_payment_number := v_payment_number + 1;
      v_amount := ROUND(rec.product_price::numeric * rec.quantity * (1 - v_ratio));

      IF v_payment_number = 1 AND v_fixed_remaining > 0 THEN
        v_amount := GREATEST(0, v_amount - v_fixed_remaining);
      END IF;

      INSERT INTO public.order_payments (
        order_id, payment_number, amount, status, paid_at, notes
      ) VALUES (
        p_order_id,
        v_payment_number,
        v_amount,
        'paid',
        now(),
        rec.product_name
      );
    END IF;
  END LOOP;

  RETURN true;
END;
$function$;