
CREATE OR REPLACE FUNCTION public.deduct_stock_on_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
BEGIN
  -- Deduct stock when status is 'pending', 'processing', OR 'completed' and stock hasn't been deducted yet
  IF (NEW.status IN ('pending', 'processing', 'completed')) AND COALESCE(OLD.stock_deducted, false) = false THEN
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

-- Also update the other trigger function to include 'pending'
CREATE OR REPLACE FUNCTION public.deduct_stock_on_processing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
BEGIN
  IF NEW.status IN ('pending', 'processing') AND COALESCE(OLD.stock_deducted, false) = false THEN
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

-- Ensure the trigger exists on the orders table
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_order_status ON public.orders;
CREATE TRIGGER trigger_deduct_stock_on_order_status
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_order_status();

DROP TRIGGER IF EXISTS trigger_deduct_stock_on_processing ON public.orders;
CREATE TRIGGER trigger_deduct_stock_on_processing
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_stock_on_processing();
