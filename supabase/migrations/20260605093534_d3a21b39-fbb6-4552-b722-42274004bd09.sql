-- =========================================================================
-- 1. Add idempotency flag for order alert emails
-- =========================================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_alert_sent_at timestamptz;

-- =========================================================================
-- 2. Helper: detect installment (division-based) order items (variant w/ >1 division)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.is_division_order_item(p_product_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_variant_id uuid;
  v_divs jsonb;
BEGIN
  IF position('__variant_' in p_product_id) = 0 THEN
    RETURN false;
  END IF;
  BEGIN
    v_variant_id := substring(split_part(p_product_id, '__', 2) from 9)::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;
  IF v_variant_id IS NULL THEN
    RETURN false;
  END IF;
  SELECT price_divisions INTO v_divs FROM public.product_variants WHERE id = v_variant_id;
  RETURN COALESCE(jsonb_array_length(v_divs), 0) > 1;
END;
$$;

-- =========================================================================
-- 3. Helper: promo eligibility for an order item (mirrors client logic)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.order_item_promo_eligible(
  p_product_id text,
  p_category text,
  p_applies_to text,
  p_product_ids text[],
  p_category_slugs text[]
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN p_applies_to IS NULL OR p_applies_to = 'all' THEN true
    WHEN p_applies_to = 'specific_products'
      THEN split_part(p_product_id, '__', 1) = ANY(COALESCE(p_product_ids, '{}'::text[]))
    WHEN p_applies_to = 'specific_categories'
      THEN p_category = ANY(COALESCE(p_category_slugs, '{}'::text[]))
    ELSE true
  END;
$$;

-- =========================================================================
-- 4. Force each customer order item to the authoritative catalog price.
--    Admins (manual orders / edits) are trusted and skipped.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_base text;
  v_variant_id uuid;
  v_price integer;
BEGIN
  -- Trusted admins may set custom prices (manual orders, billing, edits).
  IF public.is_admin_account(auth.email()) THEN
    RETURN NEW;
  END IF;

  v_base := split_part(NEW.product_id, '__', 1);

  IF position('__variant_' in NEW.product_id) > 0 THEN
    BEGIN
      v_variant_id := substring(split_part(NEW.product_id, '__', 2) from 9)::uuid;
    EXCEPTION WHEN others THEN
      v_variant_id := NULL;
    END;
    IF v_variant_id IS NOT NULL THEN
      SELECT price INTO v_price FROM public.product_variants WHERE id = v_variant_id;
    END IF;
  END IF;

  IF v_price IS NULL THEN
    SELECT price INTO v_price FROM public.products
    WHERE product_id = v_base AND is_hidden = false;
  END IF;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Invalid product in order item: %', NEW.product_id;
  END IF;

  -- Authoritative price wins over any client-supplied value.
  NEW.product_price := v_price;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_item_price ON public.order_items;
CREATE TRIGGER trg_enforce_order_item_price
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_order_item_price();

-- =========================================================================
-- 5. Recompute customer order subtotal / discount / tax / total from the
--    now-authoritative item prices + the applied promo. Admin orders skipped.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.recompute_customer_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid;
  v_promo RECORD;
  v_subtotal integer;
  v_eligible_full numeric;
  v_discount numeric;
  v_tax numeric;
BEGIN
  -- Trusted admins keep their entered totals.
  IF public.is_admin_account(auth.email()) THEN
    RETURN NULL;
  END IF;

  FOR v_order_id IN SELECT DISTINCT order_id FROM new_items LOOP
    -- Resolve the applied promo (if any / still valid record exists).
    SELECT pc.discount_type, pc.discount_percentage, pc.discount_amount,
           pc.applies_to, pc.applicable_product_ids, pc.applicable_category_slugs
      INTO v_promo
    FROM public.orders o
    LEFT JOIN public.promo_codes pc ON pc.code = o.promo_code
    WHERE o.id = v_order_id;

    -- Subtotal from authoritative item prices.
    SELECT COALESCE(SUM(oi.product_price * oi.quantity), 0)
      INTO v_subtotal
    FROM public.order_items oi
    WHERE oi.order_id = v_order_id;

    -- Discount.
    v_discount := 0;
    IF v_promo.discount_type IS NOT NULL THEN
      IF v_promo.discount_type = 'fixed' THEN
        SELECT COALESCE(SUM(oi.product_price * oi.quantity), 0)
          INTO v_eligible_full
        FROM public.order_items oi
        LEFT JOIN public.products p ON p.product_id = split_part(oi.product_id, '__', 1)
        WHERE oi.order_id = v_order_id
          AND public.order_item_promo_eligible(
                oi.product_id, p.category, v_promo.applies_to,
                v_promo.applicable_product_ids, v_promo.applicable_category_slugs);
        v_discount := LEAST(COALESCE(v_promo.discount_amount, 0), v_eligible_full);
      ELSE
        SELECT COALESCE(SUM(oi.product_price * oi.quantity
                            * COALESCE(v_promo.discount_percentage, 0) / 100.0), 0)
          INTO v_discount
        FROM public.order_items oi
        LEFT JOIN public.products p ON p.product_id = split_part(oi.product_id, '__', 1)
        WHERE oi.order_id = v_order_id
          AND public.order_item_promo_eligible(
                oi.product_id, p.category, v_promo.applies_to,
                v_promo.applicable_product_ids, v_promo.applicable_category_slugs);
      END IF;
    END IF;

    -- Tax: installment/division items are tax-inclusive (0); promo-aware for % promos.
    SELECT COALESCE(SUM(
      CASE
        WHEN public.is_division_order_item(oi.product_id) THEN 0
        ELSE (
          CASE
            WHEN v_promo.discount_type IS NOT NULL
                 AND v_promo.discount_type <> 'fixed'
                 AND public.order_item_promo_eligible(
                       oi.product_id, p.category, v_promo.applies_to,
                       v_promo.applicable_product_ids, v_promo.applicable_category_slugs)
            THEN oi.product_price * (1 - COALESCE(v_promo.discount_percentage, 0) / 100.0)
            ELSE oi.product_price
          END
        ) * oi.quantity * COALESCE(p.tax, 0) / 100.0
      END
    ), 0)
      INTO v_tax
    FROM public.order_items oi
    LEFT JOIN public.products p ON p.product_id = split_part(oi.product_id, '__', 1)
    WHERE oi.order_id = v_order_id;

    UPDATE public.orders
    SET subtotal       = v_subtotal,
        discount_amount = ROUND(v_discount),
        tax_amount     = ROUND(v_tax),
        total_amount   = v_subtotal + ROUND(v_tax) - ROUND(v_discount),
        updated_at     = now()
    WHERE id = v_order_id;
  END LOOP;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_customer_order_totals ON public.order_items;
CREATE TRIGGER trg_recompute_customer_order_totals
AFTER INSERT ON public.order_items
REFERENCING NEW TABLE AS new_items
FOR EACH STATEMENT
EXECUTE FUNCTION public.recompute_customer_order_totals();

-- =========================================================================
-- 6. Tighten INSERT policy on order_items (owners / recent guests / admins)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.can_insert_order_item(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin_account(auth.email())
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = p_order_id
        AND o.status = 'pending'
        AND (
          (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
          OR (o.user_id IS NULL AND o.created_at > now() - interval '30 minutes')
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_insert_order_item(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Enable order items creation for checkout" ON public.order_items;
CREATE POLICY "Customers can add items to their own pending orders"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (public.can_insert_order_item(order_id));

-- =========================================================================
-- 7. Tighten INSERT policy on order_payments (owners / admins only)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.can_insert_order_payment(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_admin_account(auth.email())
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = p_order_id
        AND auth.uid() IS NOT NULL
        AND o.user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_insert_order_payment(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can insert order payments at checkout" ON public.order_payments;
CREATE POLICY "Admins or owners can insert order payments"
ON public.order_payments
FOR INSERT
TO public
WITH CHECK (public.can_insert_order_payment(order_id));

-- =========================================================================
-- 8. Hide hidden products from public visibility
-- =========================================================================
DROP POLICY IF EXISTS "TEMP: allow any authenticated select" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view visible products"
ON public.products
FOR SELECT
TO public
USING (is_hidden = false);
