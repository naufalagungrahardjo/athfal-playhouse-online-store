-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Insert products: super_admin/orders_manager/order_staff" ON public.products;

-- Create a new permissive INSERT policy for products
CREATE POLICY "Insert products: super_admin/orders_manager/order_staff"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role IN ('super_admin', 'orders_manager', 'order_staff')
  )
);