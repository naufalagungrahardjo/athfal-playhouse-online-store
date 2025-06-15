
-- Enable Row Level Security (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Remove any previous product-related policies to avoid conflicts
DROP POLICY IF EXISTS "Product management for orders managers and super admins" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Insert products: orders_manager/super_admin" ON public.products;
DROP POLICY IF EXISTS "Update products: orders_manager/super_admin" ON public.products;
DROP POLICY IF EXISTS "Delete products: orders_manager/super_admin" ON public.products;

-- 1. Allow super_admin, orders_manager, and order_staff to create products
CREATE POLICY "Insert products: super_admin/orders_manager/order_staff" ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE email = (SELECT current_setting('request.jwt.claim.email', true))
        AND role IN ('super_admin', 'orders_manager', 'order_staff')
    )
  );

-- 2. Allow super_admin, orders_manager, and order_staff to update products
CREATE POLICY "Update products: super_admin/orders_manager/order_staff" ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE email = (SELECT current_setting('request.jwt.claim.email', true))
        AND role IN ('super_admin', 'orders_manager', 'order_staff')
    )
  );

-- 3. Allow only orders_manager and super_admin to delete products
CREATE POLICY "Delete products: orders_manager/super_admin" ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE email = (SELECT current_setting('request.jwt.claim.email', true))
        AND role IN ('super_admin', 'orders_manager')
    )
  );

-- 4. Allow all admins to view product data in admin CMS (if desired)
DROP POLICY IF EXISTS "Admins can view products" ON public.products;
CREATE POLICY "Admins can view products" ON public.products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE email = (SELECT current_setting('request.jwt.claim.email', true))
    )
  );
