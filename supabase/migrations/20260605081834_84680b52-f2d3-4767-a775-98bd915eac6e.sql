-- Global cycling counter for the 3-digit unique code (001..999, then resets to 001)
CREATE SEQUENCE IF NOT EXISTS public.order_unique_code_seq
  AS integer
  MINVALUE 1
  MAXVALUE 999
  START WITH 1
  INCREMENT BY 1
  CYCLE;

-- Store the assigned unique code on each order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS unique_code integer;

-- Atomically assign the next unique code to an order and add it to the order total.
CREATE OR REPLACE FUNCTION public.assign_order_unique_code(p_order_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_code integer;
  v_existing integer;
BEGIN
  SELECT unique_code INTO v_existing FROM public.orders WHERE id = p_order_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  v_code := nextval('public.order_unique_code_seq');

  UPDATE public.orders
  SET unique_code = v_code,
      total_amount = total_amount + v_code,
      updated_at = now()
  WHERE id = p_order_id;

  RETURN v_code;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.assign_order_unique_code(uuid) TO anon, authenticated, service_role;

-- Rebuild payment divisions, then add the unique code to the FIRST payment only.
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
  v_unique_code integer;
BEGIN
  DELETE FROM public.order_payments WHERE order_id = p_order_id;

  SELECT COALESCE(subtotal, 0), COALESCE(discount_amount, 0)
    INTO v_subtotal, v_discount
  FROM public.orders
  WHERE id = p_order_id;

  IF v_subtotal > 0 AND v_discount > 0 THEN
    v_ratio := v_discount::numeric / v_subtotal::numeric;
    IF v_ratio < 0 THEN v_ratio := 0; END IF;
    IF v_ratio > 1 THEN v_ratio := 1; END IF;
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
      INSERT INTO public.order_payments (
        order_id, payment_number, amount, status, paid_at, notes
      ) VALUES (
        p_order_id,
        v_payment_number,
        ROUND(rec.product_price::numeric * rec.quantity * (1 - v_ratio)),
        'paid',
        now(),
        rec.product_name
      );
    END IF;
  END LOOP;

  -- Add the order's unique verification code to the FIRST payment only
  SELECT unique_code INTO v_unique_code FROM public.orders WHERE id = p_order_id;
  IF COALESCE(v_unique_code, 0) > 0 THEN
    UPDATE public.order_payments
    SET amount = amount + v_unique_code
    WHERE order_id = p_order_id AND payment_number = 1;
  END IF;

  RETURN true;
END;
$function$;

-- Include unique_code in the guest order lookup
DROP FUNCTION IF EXISTS public.get_order_by_token(uuid, uuid);
CREATE OR REPLACE FUNCTION public.get_order_by_token(p_order_id uuid, p_token uuid)
RETURNS TABLE(
  id uuid, user_id uuid, customer_name text, customer_email text, 
  customer_phone text, customer_address text, payment_method text,
  status text, subtotal integer, tax_amount integer, total_amount integer,
  notes text, promo_code text, discount_amount integer, stock_deducted boolean,
  created_at timestamptz, updated_at timestamptz, lookup_token uuid,
  unique_code integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT o.id, o.user_id, o.customer_name, o.customer_email,
    o.customer_phone, o.customer_address, o.payment_method,
    o.status, o.subtotal, o.tax_amount, o.total_amount,
    o.notes, o.promo_code, o.discount_amount, o.stock_deducted,
    o.created_at, o.updated_at, o.lookup_token, o.unique_code
  FROM public.orders o
  WHERE o.id = p_order_id AND o.lookup_token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_token(uuid, uuid) TO anon, authenticated, service_role;