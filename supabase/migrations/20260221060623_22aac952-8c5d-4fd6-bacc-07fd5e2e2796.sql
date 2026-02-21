
-- Drop existing function and recreate with broader status coverage
CREATE OR REPLACE FUNCTION public.deduct_stock_on_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
BEGIN
  -- Deduct stock when status becomes 'processing' OR 'completed' and stock hasn't been deducted yet
  IF (NEW.status IN ('processing', 'completed')) AND COALESCE(OLD.stock_deducted, false) = false THEN
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

    NEW.stock_deducted := true;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger on the orders table (drop if exists first)
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_order_status ON public.orders;
CREATE TRIGGER trigger_deduct_stock_on_order_status
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_order_status();

-- Also handle INSERT with completed/processing status directly
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_order_insert ON public.orders;
CREATE TRIGGER trigger_deduct_stock_on_order_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_order_status();
