-- Add per-variant quota tracking
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS quota_limit integer,
  ADD COLUMN IF NOT EXISTS quota_sold integer NOT NULL DEFAULT 0;

-- Deduct stock + variant quota when an order is placed
CREATE OR REPLACE FUNCTION public.deduct_stock_for_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
  already_deducted boolean;
  v_variant_raw text;
  v_variant_id uuid;
BEGIN
  SELECT stock_deducted INTO already_deducted FROM public.orders WHERE id = p_order_id;
  IF already_deducted = true THEN
    RETURN true;
  END IF;

  -- Main product stock (uses base product id)
  FOR rec IN
    SELECT split_part(product_id, '__', 1) AS base_id, SUM(quantity) AS total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY split_part(product_id, '__', 1)
  LOOP
    UPDATE public.products
    SET stock = GREATEST(0, stock - rec.total_qty),
        updated_at = now()
    WHERE product_id = rec.base_id;
  END LOOP;

  -- Per-variant quota (only when a quota limit is set on the variant)
  FOR rec IN
    SELECT product_id AS pid, SUM(quantity) AS total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  LOOP
    v_variant_raw := split_part(rec.pid, '__', 2);
    IF v_variant_raw LIKE 'variant_%' THEN
      v_variant_raw := substring(v_variant_raw from 9);
    END IF;
    IF v_variant_raw IS NULL OR v_variant_raw = '' OR v_variant_raw = 'normal' THEN
      CONTINUE;
    END IF;
    BEGIN
      v_variant_id := v_variant_raw::uuid;
    EXCEPTION WHEN others THEN
      CONTINUE;
    END;
    UPDATE public.product_variants
    SET quota_sold = quota_sold + rec.total_qty,
        updated_at = now()
    WHERE id = v_variant_id AND quota_limit IS NOT NULL;
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = true, updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$function$;

-- Restore stock + variant quota when an order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock_for_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
  was_deducted boolean;
  v_variant_raw text;
  v_variant_id uuid;
BEGIN
  SELECT stock_deducted INTO was_deducted FROM public.orders WHERE id = p_order_id;
  IF was_deducted IS NOT TRUE THEN
    RETURN true;
  END IF;

  -- Main product stock
  FOR rec IN
    SELECT split_part(product_id, '__', 1) AS base_id, SUM(quantity) AS total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY split_part(product_id, '__', 1)
  LOOP
    UPDATE public.products
    SET stock = stock + rec.total_qty,
        updated_at = now()
    WHERE product_id = rec.base_id;
  END LOOP;

  -- Per-variant quota
  FOR rec IN
    SELECT product_id AS pid, SUM(quantity) AS total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  LOOP
    v_variant_raw := split_part(rec.pid, '__', 2);
    IF v_variant_raw LIKE 'variant_%' THEN
      v_variant_raw := substring(v_variant_raw from 9);
    END IF;
    IF v_variant_raw IS NULL OR v_variant_raw = '' OR v_variant_raw = 'normal' THEN
      CONTINUE;
    END IF;
    BEGIN
      v_variant_id := v_variant_raw::uuid;
    EXCEPTION WHEN others THEN
      CONTINUE;
    END;
    UPDATE public.product_variants
    SET quota_sold = GREATEST(0, quota_sold - rec.total_qty),
        updated_at = now()
    WHERE id = v_variant_id AND quota_limit IS NOT NULL;
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = false, updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$function$;