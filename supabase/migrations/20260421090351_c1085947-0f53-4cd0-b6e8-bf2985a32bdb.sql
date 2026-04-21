-- Add per-variant stock and sold-out flag
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_sold_out boolean NOT NULL DEFAULT false;

-- Update deduct_stock_for_order to handle variant suffix in product_id
CREATE OR REPLACE FUNCTION public.deduct_stock_for_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
  already_deducted boolean;
  v_base_id text;
  v_variant_id uuid;
  v_variant_marker text;
BEGIN
  SELECT stock_deducted INTO already_deducted FROM public.orders WHERE id = p_order_id;
  IF already_deducted = true THEN
    RETURN true;
  END IF;

  FOR rec IN
    SELECT product_id, SUM(quantity) as total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  LOOP
    -- product_id may be "BASE__variant_<uuid>" or "BASE__normal" or just "BASE"
    IF position('__variant_' in rec.product_id) > 0 THEN
      v_base_id := split_part(rec.product_id, '__', 1);
      v_variant_marker := split_part(rec.product_id, '__', 2);
      -- strip 'variant_' prefix (length 8)
      BEGIN
        v_variant_id := substring(v_variant_marker from 9)::uuid;
      EXCEPTION WHEN others THEN
        v_variant_id := NULL;
      END;
      IF v_variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = GREATEST(0, stock - rec.total_qty),
            updated_at = now()
        WHERE id = v_variant_id;
      END IF;
    ELSE
      -- base product (no variant or "__normal")
      v_base_id := split_part(rec.product_id, '__', 1);
      UPDATE public.products
      SET stock = GREATEST(0, stock - rec.total_qty),
          updated_at = now()
      WHERE product_id = v_base_id;
    END IF;
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = true, updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$function$;

-- Update restore_stock_for_order similarly
CREATE OR REPLACE FUNCTION public.restore_stock_for_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
  was_deducted boolean;
  v_base_id text;
  v_variant_id uuid;
  v_variant_marker text;
BEGIN
  SELECT stock_deducted INTO was_deducted FROM public.orders WHERE id = p_order_id;
  IF was_deducted IS NOT TRUE THEN
    RETURN true;
  END IF;

  FOR rec IN
    SELECT product_id, SUM(quantity) as total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  LOOP
    IF position('__variant_' in rec.product_id) > 0 THEN
      v_base_id := split_part(rec.product_id, '__', 1);
      v_variant_marker := split_part(rec.product_id, '__', 2);
      BEGIN
        v_variant_id := substring(v_variant_marker from 9)::uuid;
      EXCEPTION WHEN others THEN
        v_variant_id := NULL;
      END;
      IF v_variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = stock + rec.total_qty,
            updated_at = now()
        WHERE id = v_variant_id;
      END IF;
    ELSE
      v_base_id := split_part(rec.product_id, '__', 1);
      UPDATE public.products
      SET stock = stock + rec.total_qty,
          updated_at = now()
      WHERE product_id = v_base_id;
    END IF;
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = false, updated_at = now()
  WHERE id = p_order_id;

  RETURN true;
END;
$function$;

-- Update auto_cancel_stale_orders to use the new RPC behavior via per-row processing
CREATE OR REPLACE FUNCTION public.auto_cancel_stale_orders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  rec RECORD;
  cancelled_count integer := 0;
BEGIN
  FOR rec IN
    SELECT id FROM public.orders
    WHERE status = 'pending'
      AND created_at < (now() - interval '12 hours')
  LOOP
    PERFORM public.restore_stock_for_order(rec.id);

    UPDATE public.orders
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = rec.id;

    cancelled_count := cancelled_count + 1;
  END LOOP;

  RETURN cancelled_count;
END;
$function$;