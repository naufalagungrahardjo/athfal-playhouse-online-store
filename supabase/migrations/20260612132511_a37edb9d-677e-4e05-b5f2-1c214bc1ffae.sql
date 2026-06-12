-- 1) Ensure merchant fee rate is never exposed to public / authenticated customers.
REVOKE SELECT (mdr_rate) ON public.payment_methods FROM anon, authenticated;

-- 2) Restrict promo_codes access to super_admin and orders_manager only.
DROP POLICY IF EXISTS "Admins can view all promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can insert promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can update promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can delete promo_codes" ON public.promo_codes;

CREATE POLICY "Promo managers can view promo_codes"
ON public.promo_codes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role])
));

CREATE POLICY "Promo managers can insert promo_codes"
ON public.promo_codes FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role])
));

CREATE POLICY "Promo managers can update promo_codes"
ON public.promo_codes FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role])
));

CREATE POLICY "Promo managers can delete promo_codes"
ON public.promo_codes FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role])
));

-- 3) Enforce minimal data integrity on guest/customer order creation.
CREATE OR REPLACE FUNCTION public.validate_order_customer_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Trusted admins may create orders with looser data (manual orders, billing).
  IF public.is_admin_account(auth.email()) THEN
    RETURN NEW;
  END IF;

  IF NEW.customer_name IS NULL OR length(trim(NEW.customer_name)) < 2 THEN
    RAISE EXCEPTION 'A valid customer name is required';
  END IF;

  IF NEW.customer_email IS NULL OR NEW.customer_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'A valid customer email is required';
  END IF;

  IF NEW.customer_phone IS NULL OR length(regexp_replace(NEW.customer_phone, '\D', '', 'g')) < 7 THEN
    RAISE EXCEPTION 'A valid customer phone number is required';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_order_customer_data_trigger ON public.orders;
CREATE TRIGGER validate_order_customer_data_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_customer_data();