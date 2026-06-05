-- Make payment divisions discount-aware: each division stores the DISCOUNTED amount
-- so that the sum of divisions equals the order total, and revenue (amount_paid)
-- naturally excludes the discount portion.
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
BEGIN
  -- Remove any existing payments (e.g. the auto-created full payment) so we can rebuild
  DELETE FROM public.order_payments WHERE order_id = p_order_id;

  -- Determine the order-level discount ratio so it applies to ALL divisions
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
      -- One payment per division; first division paid, rest unpaid.
      -- The discount ratio is applied to every division.
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
      -- No divisions: treat as a single fully-paid payment (Lunas / plain product)
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

  RETURN true;
END;
$function$;

-- Secure RPC so guest customers can view their order's payment divisions via lookup token
CREATE OR REPLACE FUNCTION public.get_order_payments_by_token(p_order_id uuid, p_token uuid)
 RETURNS TABLE(id uuid, order_id uuid, payment_number integer, amount integer, status text, paid_at timestamp with time zone, notes text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT op.id, op.order_id, op.payment_number, op.amount, op.status,
         op.paid_at, op.notes, op.created_at
  FROM public.order_payments op
  INNER JOIN public.orders o ON o.id = op.order_id
  WHERE op.order_id = p_order_id AND o.lookup_token = p_token
  ORDER BY op.payment_number ASC;
$function$;

GRANT EXECUTE ON FUNCTION public.get_order_payments_by_token(uuid, uuid) TO anon, authenticated, service_role;