-- 1. Add product-level toggles
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS use_sessions boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_reminders_enabled boolean NOT NULL DEFAULT true;

-- 2. product_sessions table
CREATE TABLE IF NOT EXISTS public.product_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  is_sold_out boolean NOT NULL DEFAULT false,
  order_num integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_sessions_product_id ON public.product_sessions(product_id);
ALTER TABLE public.product_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product sessions"
  ON public.product_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can insert product sessions"
  ON public.product_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()
    AND role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role, 'order_staff'::admin_role])));
CREATE POLICY "Admins can update product sessions"
  ON public.product_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()
    AND role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role, 'order_staff'::admin_role])));
CREATE POLICY "Admins can delete product sessions"
  ON public.product_sessions FOR DELETE
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()
    AND role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role])));

-- 3. product_installment_plans table
CREATE TABLE IF NOT EXISTS public.product_installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  num_payments integer NOT NULL DEFAULT 1,
  payment_amounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_num integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_installment_plans_product_id ON public.product_installment_plans(product_id);
ALTER TABLE public.product_installment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view installment plans"
  ON public.product_installment_plans FOR SELECT USING (true);
CREATE POLICY "Admins can insert installment plans"
  ON public.product_installment_plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()
    AND role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role, 'order_staff'::admin_role])));
CREATE POLICY "Admins can update installment plans"
  ON public.product_installment_plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()
    AND role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role, 'order_staff'::admin_role])));
CREATE POLICY "Admins can delete installment plans"
  ON public.product_installment_plans FOR DELETE
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()
    AND role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role])));

-- 4. order_items: track chosen session + plan
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS session_name text,
  ADD COLUMN IF NOT EXISTS installment_plan_id uuid,
  ADD COLUMN IF NOT EXISTS installment_plan_name text;

-- 5. order_payments table
CREATE TABLE IF NOT EXISTS public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_number integer NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'unpaid',
  paid_at timestamptz,
  last_reminder_sent_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_due_date ON public.order_payments(due_date) WHERE status = 'unpaid';
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all order payments"
  ON public.order_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()));
CREATE POLICY "Owners can view own order payments"
  ON public.order_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_payments.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Anyone can insert order payments at checkout"
  ON public.order_payments FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Admins can update order payments"
  ON public.order_payments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()
    AND role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role, 'order_staff'::admin_role])));
CREATE POLICY "Admins can delete order payments"
  ON public.order_payments FOR DELETE
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE email = auth.email()
    AND role = ANY (ARRAY['super_admin'::admin_role, 'orders_manager'::admin_role])));

-- 6. Trigger to keep orders.amount_paid in sync
CREATE OR REPLACE FUNCTION public.sync_order_amount_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id uuid;
  v_total_paid integer;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.order_payments
    WHERE order_id = v_order_id AND status = 'paid';
  UPDATE public.orders SET amount_paid = v_total_paid, updated_at = now()
    WHERE id = v_order_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_amount_paid ON public.order_payments;
CREATE TRIGGER trg_sync_order_amount_paid
  AFTER INSERT OR UPDATE OR DELETE ON public.order_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_amount_paid();

-- 7. Updated_at trigger function (reused)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_product_sessions_updated ON public.product_sessions;
CREATE TRIGGER trg_product_sessions_updated BEFORE UPDATE ON public.product_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_product_installment_plans_updated ON public.product_installment_plans;
CREATE TRIGGER trg_product_installment_plans_updated BEFORE UPDATE ON public.product_installment_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_order_payments_updated ON public.order_payments;
CREATE TRIGGER trg_order_payments_updated BEFORE UPDATE ON public.order_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Backfill: default "Full Payment" plan for every existing product
INSERT INTO public.product_installment_plans (product_id, name, num_payments, payment_amounts, order_num)
SELECT p.id, 'Full Payment', 1, '[]'::jsonb, 1
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_installment_plans pip WHERE pip.product_id = p.id
);

-- 9. Backfill: one order_payments row per existing order
INSERT INTO public.order_payments (order_id, payment_number, amount, status, paid_at)
SELECT o.id, 1, o.total_amount,
  CASE WHEN COALESCE(o.amount_paid, 0) >= o.total_amount THEN 'paid' ELSE 'unpaid' END,
  CASE WHEN COALESCE(o.amount_paid, 0) >= o.total_amount THEN o.updated_at ELSE NULL END
FROM public.orders o
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_payments op WHERE op.order_id = o.id
);
