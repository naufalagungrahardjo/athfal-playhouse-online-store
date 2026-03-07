
CREATE OR REPLACE FUNCTION public.deduct_stock_on_processing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
BEGIN
  -- On INSERT, OLD is not available, so just check status directly
  IF NEW.status IN ('pending', 'processing') AND COALESCE(NEW.stock_deducted, false) = false THEN
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
