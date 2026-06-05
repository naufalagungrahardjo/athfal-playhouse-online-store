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
  v_raw numeric;
  v_idx int;
  v_payment_number int := 0;
  v_subtotal integer;
  v_discount integer;
  v_ratio numeric := 0;
  v_unique_code integer;
  v_tax integer;
  v_gross_total numeric := 0;
  v_net_total numeric := 0;
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
        v_raw := COALESCE((v_divisions->>v_idx)::numeric, 0) * rec.quantity;
        v_amount := ROUND(v_raw * (1 - v_ratio));
        v_gross_total := v_gross_total + v_raw;
        v_net_total := v_net_total + v_amount;
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
      v_raw := rec.product_price::numeric * rec.quantity;
      v_amount := ROUND(v_raw * (1 - v_ratio));
      v_gross_total := v_gross_total + v_raw;
      v_net_total := v_net_total + v_amount;
      v_payment_number := v_payment_number + 1;
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

  -- Add the order's unique verification code to the FIRST payment only
  SELECT unique_code, COALESCE(tax_amount, 0)
    INTO v_unique_code, v_tax
  FROM public.orders WHERE id = p_order_id;

  IF COALESCE(v_unique_code, 0) > 0 THEN
    UPDATE public.order_payments
    SET amount = amount + v_unique_code
    WHERE order_id = p_order_id AND payment_number = 1;
  END IF;

  -- Recompute the order's stored totals so they reflect the FULL installment
  -- schedule (every division), not just the first payment of each variant.
  -- This keeps amount_paid <= total_amount so the dashboard / analytics count
  -- every collected installment as revenue.
  UPDATE public.orders
  SET subtotal        = ROUND(v_gross_total),
      discount_amount = GREATEST(0, ROUND(v_gross_total - v_net_total)),
      total_amount    = ROUND(v_net_total) + COALESCE(v_unique_code, 0) + COALESCE(v_tax, 0),
      updated_at      = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$function$;