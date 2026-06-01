-- 1. Add price_divisions to product_variants (sub-products)
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS price_divisions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. RPC to set up per-division payments for an order
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
BEGIN
  -- Remove any existing payments (e.g. the auto-created full payment) so we can rebuild
  DELETE FROM public.order_payments WHERE order_id = p_order_id;

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
      -- One payment per division; first division paid, rest unpaid
      FOR v_idx IN 0..(v_div_count - 1) LOOP
        v_amount := COALESCE((v_divisions->>v_idx)::integer, 0) * rec.quantity;
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
      -- No divisions: treat as a single fully-paid payment (Lunas / plain product)
      v_payment_number := v_payment_number + 1;
      INSERT INTO public.order_payments (
        order_id, payment_number, amount, status, paid_at, notes
      ) VALUES (
        p_order_id,
        v_payment_number,
        rec.product_price * rec.quantity,
        'paid',
        now(),
        rec.product_name
      );
    END IF;
  END LOOP;

  RETURN true;
END;
$function$;

-- 3. Stock deduction: decrement parent product's shared stock for all items (variant or not)
CREATE OR REPLACE FUNCTION public.deduct_stock_for_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
  already_deducted boolean;
  v_base_id text;
BEGIN
  SELECT stock_deducted INTO already_deducted FROM public.orders WHERE id = p_order_id;
  IF already_deducted = true THEN
    RETURN true;
  END IF;

  FOR rec IN
    SELECT split_part(product_id, '__', 1) AS base_id, SUM(quantity) AS total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY split_part(product_id, '__', 1)
  LOOP
    UPDATE public.products
    SET stock = GREATEST(0, stock - rec.total_qty),
        updated_at = now()
    WHERE product_id = rec.base_id;
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = true, updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$function$;

-- 4. Stock restoration: restore parent product's shared stock for all items
CREATE OR REPLACE FUNCTION public.restore_stock_for_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
  was_deducted boolean;
BEGIN
  SELECT stock_deducted INTO was_deducted FROM public.orders WHERE id = p_order_id;
  IF was_deducted IS NOT TRUE THEN
    RETURN true;
  END IF;

  FOR rec IN
    SELECT split_part(product_id, '__', 1) AS base_id, SUM(quantity) AS total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY split_part(product_id, '__', 1)
  LOOP
    UPDATE public.products
    SET stock = stock + rec.total_qty,
        updated_at = now()
    WHERE product_id = rec.base_id;
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = false, updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$function$;

-- Allow callers (including guest checkout) to execute the new RPC
GRANT EXECUTE ON FUNCTION public.setup_order_payments_for_order(uuid) TO anon, authenticated, service_role;