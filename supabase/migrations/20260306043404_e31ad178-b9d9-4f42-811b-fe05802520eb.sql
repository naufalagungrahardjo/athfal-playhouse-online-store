-- 1. Create a private storage bucket for teacher evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-evidence', 'teacher-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies for teacher-evidence bucket
-- Teachers can upload their own evidence
CREATE POLICY "Teachers can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'teacher-evidence'
  AND (storage.foldername(name))[1] = auth.email()
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('teacher', 'super_admin')
  )
);

-- Teachers can view their own evidence, super_admin can view all
CREATE POLICY "Teachers and admins can view evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'teacher-evidence'
  AND (
    (storage.foldername(name))[1] = auth.email()
    OR EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role = 'super_admin'
    )
  )
);

-- Super admin can delete evidence
CREATE POLICY "Super admin can delete evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'teacher-evidence'
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role = 'super_admin'
  )
);

-- 3. Order price validation trigger
CREATE OR REPLACE FUNCTION public.validate_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  computed_subtotal integer := 0;
  computed_tax integer := 0;
  computed_total integer := 0;
  discount integer := 0;
BEGIN
  -- This trigger fires AFTER order_items are inserted via a deferred approach
  -- Instead, we validate at INSERT time on orders using a simpler check:
  -- Ensure amounts are non-negative and total >= subtotal (after discount)
  IF NEW.subtotal < 0 OR NEW.tax_amount < 0 OR NEW.total_amount < 0 THEN
    RAISE EXCEPTION 'Order amounts cannot be negative';
  END IF;
  
  IF NEW.total_amount > 100000000 THEN
    RAISE EXCEPTION 'Order total exceeds maximum allowed value';
  END IF;

  -- Ensure total_amount is consistent with subtotal + tax - discount
  discount := COALESCE(NEW.discount_amount, 0);
  computed_total := NEW.subtotal + NEW.tax_amount - discount;
  
  IF ABS(NEW.total_amount - computed_total) > 1 THEN
    RAISE EXCEPTION 'Order total (%) does not match subtotal (%) + tax (%) - discount (%)', 
      NEW.total_amount, NEW.subtotal, NEW.tax_amount, discount;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_totals_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_totals();
