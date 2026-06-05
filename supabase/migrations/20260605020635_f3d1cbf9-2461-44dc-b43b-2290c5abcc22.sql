DO $$
DECLARE
  r RECORD;
  v_total integer;
BEGIN
  FOR r IN
    SELECT o.id
    FROM public.orders o
    WHERE EXISTS (
        SELECT 1 FROM public.order_items oi
        WHERE oi.order_id = o.id
          AND oi.product_id LIKE '%\_\_variant\_%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.order_payments op WHERE op.order_id = o.id
      )
  LOOP
    -- Build per-division payment rows (first division paid, rest unpaid)
    PERFORM public.setup_order_payments_for_order(r.id);

    -- The full order value is the sum of all division amounts
    SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM public.order_payments
    WHERE order_id = r.id;

    -- Only fix the total when it was never set (legacy/pre-feature orders)
    UPDATE public.orders
    SET total_amount = v_total,
        subtotal = v_total,
        updated_at = now()
    WHERE id = r.id
      AND total_amount = 0;
  END LOOP;
END $$;
