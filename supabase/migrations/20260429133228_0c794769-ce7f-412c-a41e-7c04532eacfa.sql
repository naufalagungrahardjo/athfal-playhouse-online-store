CREATE OR REPLACE FUNCTION public.auto_mark_order_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM public.order_payments WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  IF NEW.total_amount > 0 THEN
    INSERT INTO public.order_payments (order_id, amount, status, notes, paid_at)
    VALUES (NEW.id, NEW.total_amount, 'paid', 'Auto-marked paid on order creation', now());
  END IF;

  RETURN NEW;
END;
$function$;