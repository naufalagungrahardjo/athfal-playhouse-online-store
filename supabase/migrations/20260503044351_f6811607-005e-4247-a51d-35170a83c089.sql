-- Create billing notices table
CREATE TABLE public.billing_notices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  description text,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.billing_notice_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id uuid NOT NULL REFERENCES public.billing_notices(id) ON DELETE CASCADE,
  order_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (notice_id, order_id)
);

CREATE INDEX idx_bna_order_id ON public.billing_notice_assignments(order_id);
CREATE INDEX idx_bna_notice_id ON public.billing_notice_assignments(notice_id);

ALTER TABLE public.billing_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_notice_assignments ENABLE ROW LEVEL SECURITY;

-- Admins (super_admin / orders_manager / order_staff) manage notices
CREATE POLICY "Admins can view billing notices"
ON public.billing_notices FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email()));

CREATE POLICY "Admins can insert billing notices"
ON public.billing_notices FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role IN ('super_admin','orders_manager','order_staff')));

CREATE POLICY "Admins can update billing notices"
ON public.billing_notices FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role IN ('super_admin','orders_manager','order_staff')));

CREATE POLICY "Admins can delete billing notices"
ON public.billing_notices FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role IN ('super_admin','orders_manager')));

-- Assignments
CREATE POLICY "Admins can view billing notice assignments"
ON public.billing_notice_assignments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email()));

CREATE POLICY "Admins can insert billing notice assignments"
ON public.billing_notice_assignments FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role IN ('super_admin','orders_manager','order_staff')));

CREATE POLICY "Admins can delete billing notice assignments"
ON public.billing_notice_assignments FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admin_accounts a
  WHERE a.email = auth.email()
    AND a.role IN ('super_admin','orders_manager','order_staff')));

-- Customers can view assignments for their own orders
CREATE POLICY "Users can view assignments for their orders"
ON public.billing_notice_assignments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders o
  WHERE o.id = billing_notice_assignments.order_id AND o.user_id = auth.uid()));

-- Customers can read notice details if assigned to their order
CREATE POLICY "Users can view billing notices assigned to them"
ON public.billing_notices FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.billing_notice_assignments bna
  JOIN public.orders o ON o.id = bna.order_id
  WHERE bna.notice_id = billing_notices.id AND o.user_id = auth.uid()
));

-- Updated at trigger
CREATE TRIGGER set_billing_notices_updated_at
BEFORE UPDATE ON public.billing_notices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();