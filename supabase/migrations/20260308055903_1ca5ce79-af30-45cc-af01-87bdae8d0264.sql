
-- Drop the BEFORE INSERT triggers that incorrectly set stock_deducted=true
-- before order_items exist, preventing the RPC from actually deducting stock
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_order_insert ON public.orders;
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_processing ON public.orders;

-- Also drop the BEFORE UPDATE versions since we handle stock via RPC at checkout
-- and will handle restoration on cancellation in code
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_order_status ON public.orders;
DROP TRIGGER IF EXISTS trg_deduct_stock_on_processing ON public.orders;

-- Create a restore_stock_for_order RPC for admin cancellation
CREATE OR REPLACE FUNCTION public.restore_stock_for_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  rec RECORD;
  was_deducted boolean;
BEGIN
  SELECT stock_deducted INTO was_deducted FROM public.orders WHERE id = p_order_id;
  IF was_deducted IS NOT TRUE THEN
    RETURN true; -- Nothing to restore
  END IF;

  FOR rec IN
    SELECT product_id, SUM(quantity) as total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  LOOP
    UPDATE public.products
    SET stock = stock + rec.total_qty,
        updated_at = now()
    WHERE product_id = rec.product_id;
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = false, updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$$;
