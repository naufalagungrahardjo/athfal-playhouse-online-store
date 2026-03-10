
CREATE OR REPLACE FUNCTION public.create_mdr_expense_for_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order RECORD;
  v_mdr_rate numeric;
  v_mdr_amount integer;
  v_category_id uuid;
  v_fund_source_id uuid;
  v_product_names text;
  v_description text;
BEGIN
  -- Get order details
  SELECT id, payment_method, total_amount
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get MDR rate from payment method
  SELECT mdr_rate INTO v_mdr_rate
  FROM public.payment_methods
  WHERE bank_name = v_order.payment_method
  LIMIT 1;

  IF v_mdr_rate IS NULL OR v_mdr_rate <= 0 THEN
    RETURN false; -- No MDR rate, nothing to do
  END IF;

  -- Calculate MDR amount
  v_mdr_amount := ROUND((v_order.total_amount * v_mdr_rate) / 100);
  IF v_mdr_amount <= 0 THEN
    RETURN false;
  END IF;

  -- Check for duplicate (dedup by order ID in description)
  IF EXISTS (
    SELECT 1 FROM public.expenses
    WHERE description LIKE '%' || p_order_id::text || '%'
      AND description LIKE 'MDR%'
  ) THEN
    RETURN true; -- Already exists
  END IF;

  -- Get product names from order items
  SELECT string_agg(oi.product_name, ', ')
  INTO v_product_names
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id;

  -- Build description: "MDR - product names - Order ID"
  v_description := 'MDR - ' || COALESCE(v_product_names, 'Unknown') || ' - ' || p_order_id::text;

  -- Get or create "MDR Fee" expense category
  SELECT id INTO v_category_id
  FROM public.expense_categories
  WHERE name = 'MDR Fee'
  LIMIT 1;

  IF v_category_id IS NULL THEN
    INSERT INTO public.expense_categories (name)
    VALUES ('MDR Fee')
    RETURNING id INTO v_category_id;
  END IF;

  -- Get or create fund source matching payment method name
  SELECT id INTO v_fund_source_id
  FROM public.expense_fund_sources
  WHERE LOWER(name) = LOWER(v_order.payment_method)
  LIMIT 1;

  IF v_fund_source_id IS NULL THEN
    INSERT INTO public.expense_fund_sources (name)
    VALUES (v_order.payment_method)
    RETURNING id INTO v_fund_source_id;
  END IF;

  -- Insert MDR expense
  INSERT INTO public.expenses (description, amount, category_id, fund_source_id, date)
  VALUES (v_description, v_mdr_amount, v_category_id, v_fund_source_id, CURRENT_DATE);

  RETURN true;
END;
$function$;
