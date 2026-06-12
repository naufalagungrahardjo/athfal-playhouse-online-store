-- Helper: is the current user a product manager (case-insensitive email match)
CREATE OR REPLACE FUNCTION public.is_product_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE lower(email) = lower(auth.email())
      AND role IN ('super_admin'::admin_role, 'orders_manager'::admin_role, 'order_staff'::admin_role)
  );
$$;

-- Helper: can the current user delete products
CREATE OR REPLACE FUNCTION public.is_product_deleter()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE lower(email) = lower(auth.email())
      AND role IN ('super_admin'::admin_role, 'orders_manager'::admin_role)
  );
$$;

-- Helper: is the current user any admin account (case-insensitive)
CREATE OR REPLACE FUNCTION public.is_admin_account_ci()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE lower(email) = lower(auth.email())
  );
$$;

-- Drop the fragile / dead policies
DROP POLICY IF EXISTS "Update products: super_admin/orders_manager/order_staff" ON public.products;
DROP POLICY IF EXISTS "update_products_auth_email" ON public.products;
DROP POLICY IF EXISTS "Delete products: orders_manager/super_admin" ON public.products;
DROP POLICY IF EXISTS "delete_products_auth_email" ON public.products;
DROP POLICY IF EXISTS "Insert products: super_admin/orders_manager/order_staff" ON public.products;
DROP POLICY IF EXISTS "Admins can view products" ON public.products;

-- Admin read access (including hidden products) for the admin panel
CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.is_admin_account_ci());

-- Insert
CREATE POLICY "Product managers can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_product_manager());

-- Update (both USING for the existing row and WITH CHECK for the new values)
CREATE POLICY "Product managers can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.is_product_manager())
  WITH CHECK (public.is_product_manager());

-- Delete
CREATE POLICY "Product managers can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.is_product_deleter());

GRANT EXECUTE ON FUNCTION public.is_product_manager() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_product_deleter() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_account_ci() TO authenticated, service_role;