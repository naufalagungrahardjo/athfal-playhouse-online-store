
-- Create product_variants table for sub-product options (e.g. early bird, installment price)
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price integer NOT NULL,
  order_num integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Public can view variants
CREATE POLICY "Public can view product variants"
  ON public.product_variants FOR SELECT
  USING (true);

-- Admins can manage variants
CREATE POLICY "Admins can insert product variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'orders_manager', 'order_staff')
  ));

CREATE POLICY "Admins can update product variants"
  ON public.product_variants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'orders_manager', 'order_staff')
  ));

CREATE POLICY "Admins can delete product variants"
  ON public.product_variants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'orders_manager')
  ));
