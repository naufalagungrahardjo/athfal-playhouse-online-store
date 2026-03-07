
CREATE OR REPLACE FUNCTION public.deduct_stock_for_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  rec RECORD;
  already_deducted boolean;
BEGIN
  -- Check if stock already deducted
  SELECT stock_deducted INTO already_deducted FROM public.orders WHERE id = p_order_id;
  IF already_deducted = true THEN
    RETURN true; -- Already done
  END IF;

  -- Deduct stock for each order item
  FOR rec IN
    SELECT product_id, SUM(quantity) as total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  LOOP
    UPDATE public.products
    SET stock = GREATEST(0, stock - rec.total_qty),
        updated_at = now()
    WHERE product_id = rec.product_id;
  END LOOP;

  -- Mark order as stock_deducted
  UPDATE public.orders
  SET stock_deducted = true, updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$$;
