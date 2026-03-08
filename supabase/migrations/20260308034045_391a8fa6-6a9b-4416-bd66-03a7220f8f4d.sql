
-- Create a function to auto-cancel stale pending orders and restore stock
CREATE OR REPLACE FUNCTION public.auto_cancel_stale_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  rec RECORD;
  item_rec RECORD;
  cancelled_count integer := 0;
BEGIN
  -- Find all pending orders older than 12 hours that haven't been moved to processing/completed
  FOR rec IN
    SELECT id FROM public.orders
    WHERE status = 'pending'
      AND created_at < (now() - interval '12 hours')
  LOOP
    -- Restore stock if it was deducted
    IF (SELECT stock_deducted FROM public.orders WHERE id = rec.id) = true THEN
      FOR item_rec IN
        SELECT product_id, SUM(quantity) as total_qty
        FROM public.order_items
        WHERE order_id = rec.id
        GROUP BY product_id
      LOOP
        UPDATE public.products
        SET stock = stock + item_rec.total_qty,
            updated_at = now()
        WHERE product_id = item_rec.product_id;
      END LOOP;
    END IF;

    -- Mark order as cancelled and reset stock_deducted
    UPDATE public.orders
    SET status = 'cancelled',
        stock_deducted = false,
        updated_at = now()
    WHERE id = rec.id;

    cancelled_count := cancelled_count + 1;
  END LOOP;

  RETURN cancelled_count;
END;
$$;
