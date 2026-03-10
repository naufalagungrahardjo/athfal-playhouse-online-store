
-- Add order_id column to expenses table
ALTER TABLE public.expenses ADD COLUMN order_id uuid NULL;

-- Update existing MDR expenses to extract order_id from description
UPDATE public.expenses
SET order_id = (
  regexp_match(description, '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
)[1]::uuid
WHERE description LIKE 'MDR%'
  AND description ~ '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Update the RPC to populate order_id
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
  SELECT id, payment_method, total_amount
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT mdr_rate INTO v_mdr_rate
  FROM public.payment_methods
  WHERE bank_name = v_order.payment_method
  LIMIT 1;

  IF v_mdr_rate IS NULL OR v_mdr_rate <= 0 THEN
    RETURN false;
  END IF;

  v_mdr_amount := ROUND((v_order.total_amount * v_mdr_rate) / 100);
  IF v_mdr_amount <= 0 THEN
    RETURN false;
  END IF;

  -- Check for duplicate by order_id
  IF EXISTS (
    SELECT 1 FROM public.expenses
    WHERE order_id = p_order_id
      AND description LIKE 'MDR%'
  ) THEN
    RETURN true;
  END IF;

  SELECT string_agg(oi.product_name, ', ')
  INTO v_product_names
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id;

  v_description := 'MDR - ' || COALESCE(v_product_names, 'Unknown') || ' - ' || p_order_id::text;

  SELECT id INTO v_category_id
  FROM public.expense_categories
  WHERE name = 'MDR Fee'
  LIMIT 1;

  IF v_category_id IS NULL THEN
    INSERT INTO public.expense_categories (name)
    VALUES ('MDR Fee')
    RETURNING id INTO v_category_id;
  END IF;

  SELECT id INTO v_fund_source_id
  FROM public.expense_fund_sources
  WHERE LOWER(name) = LOWER(v_order.payment_method)
  LIMIT 1;

  IF v_fund_source_id IS NULL THEN
    INSERT INTO public.expense_fund_sources (name)
    VALUES (v_order.payment_method)
    RETURNING id INTO v_fund_source_id;
  END IF;

  INSERT INTO public.expenses (description, amount, category_id, fund_source_id, date, order_id)
  VALUES (v_description, v_mdr_amount, v_category_id, v_fund_source_id, CURRENT_DATE, p_order_id);

  RETURN true;
END;
$function$;
