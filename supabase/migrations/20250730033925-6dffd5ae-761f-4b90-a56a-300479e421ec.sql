-- Fix remaining security warnings

-- 1. Fix function search paths for all database functions
CREATE OR REPLACE FUNCTION public.sync_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name, password, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', ''), 
    '', 
    now(), 
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restrict_order_staff_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  staff_role text;
BEGIN
  SELECT role INTO staff_role FROM public.admin_accounts
    WHERE email = current_setting('request.jwt.claim.email', true)
    LIMIT 1;

  IF staff_role = 'order_staff' THEN
    IF
      NEW.customer_name IS DISTINCT FROM OLD.customer_name OR
      NEW.customer_email IS DISTINCT FROM OLD.customer_email OR
      NEW.customer_phone IS DISTINCT FROM OLD.customer_phone OR
      NEW.customer_address IS DISTINCT FROM OLD.customer_address OR
      NEW.payment_method IS DISTINCT FROM OLD.payment_method OR
      NEW.subtotal IS DISTINCT FROM OLD.subtotal OR
      NEW.tax_amount IS DISTINCT FROM OLD.tax_amount OR
      NEW.total_amount IS DISTINCT FROM OLD.total_amount OR
      NEW.promo_code IS DISTINCT FROM OLD.promo_code OR
      NEW.discount_amount IS DISTINCT FROM OLD.discount_amount OR
      NEW.notes IS DISTINCT FROM OLD.notes
    THEN
      RAISE EXCEPTION 'order_staff can only update order status';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = $1
  );
$function$;