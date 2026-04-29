CREATE OR REPLACE FUNCTION public.auto_mark_order_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Skip if any payment record already exists for this order
  IF EXISTS (SELECT 1 FROM public.order_payments WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF NEW.total_amount > 0 THEN
    INSERT INTO public.order_payments (order_id, amount, status, payment_method, notes)
    VALUES (NEW.id, NEW.total_amount, 'paid', NEW.payment_method, 'Auto-marked paid on order creation');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_auto_mark_order_paid ON public.orders;
CREATE TRIGGER trg_auto_mark_order_paid
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_mark_order_paid();