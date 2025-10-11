-- Deduct product stock when an order moves to processing
-- Idempotent: drop existing trigger and function first
DROP TRIGGER IF EXISTS trg_deduct_stock_on_processing ON public.orders;
DROP FUNCTION IF EXISTS public.deduct_stock_on_processing();

-- Create trigger function
CREATE OR REPLACE FUNCTION public.deduct_stock_on_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Only act when status becomes 'processing' and stock hasn't been deducted yet
  IF NEW.status = 'processing' AND COALESCE(OLD.stock_deducted, false) = false THEN
    -- Deduct stock for each item in the order
    FOR rec IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id
    LOOP
      UPDATE public.products
      SET stock = GREATEST(0, stock - rec.quantity),
          updated_at = now()
      WHERE product_id = rec.product_id;
    END LOOP;

    -- Mark as deducted and update timestamp
    NEW.stock_deducted := true;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on orders updates
CREATE TRIGGER trg_deduct_stock_on_processing
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.deduct_stock_on_processing();