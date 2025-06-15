-- 1. Allow "order_staff" to update orders in RLS (policy already broad)
DROP POLICY IF EXISTS "Orders - Update status for order_staff" ON public.orders;
CREATE POLICY "Orders - Update for order_staff (all fields, trigger restricts)" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE email = current_setting('request.jwt.claim.email', true)
      AND role = 'order_staff'
    )
  );

-- 2. Create BEFORE UPDATE trigger function to restrict what "order_staff" can update
CREATE OR REPLACE FUNCTION public.restrict_order_staff_update()
RETURNS trigger AS $$
DECLARE
  staff_role text;
BEGIN
  -- Find the role of the current user
  SELECT role INTO staff_role FROM public.admin_accounts
    WHERE email = current_setting('request.jwt.claim.email', true)
    LIMIT 1;

  IF staff_role = 'order_staff' THEN
    -- Only allow changes to 'status'. If anything else changed, fail.
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 3. Attach the trigger to the orders table
DROP TRIGGER IF EXISTS restrict_order_staff_update ON public.orders;
CREATE TRIGGER restrict_order_staff_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restrict_order_staff_update();
