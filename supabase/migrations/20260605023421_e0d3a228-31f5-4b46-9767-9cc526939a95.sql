-- Automatically build payment divisions whenever order items are inserted,
-- so customers/admins always see the per-division payment toggles without
-- depending on the client calling the RPC.

CREATE OR REPLACE FUNCTION public.setup_payments_after_order_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  FOR v_order_id IN SELECT DISTINCT order_id FROM new_items LOOP
    PERFORM public.setup_order_payments_for_order(v_order_id);
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_setup_payments_after_order_items ON public.order_items;

CREATE TRIGGER trg_setup_payments_after_order_items
AFTER INSERT ON public.order_items
REFERENCING NEW TABLE AS new_items
FOR EACH STATEMENT
EXECUTE FUNCTION public.setup_payments_after_order_items();

-- Backfill: rebuild divisions for any existing order that still has the single
-- auto-created payment (or none) but contains a variant item with divisions.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT o.id
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE position('__variant_' in oi.product_id) > 0
      AND (SELECT count(*) FROM public.order_payments p WHERE p.order_id = o.id) <= 1
  LOOP
    PERFORM public.setup_order_payments_for_order(r.id);
  END LOOP;
END $$;