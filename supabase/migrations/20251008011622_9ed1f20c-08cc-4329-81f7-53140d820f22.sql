-- Fix the admin_can_update_orders policy to use auth.email()
DROP POLICY IF EXISTS "admin_can_update_orders" ON public.orders;

CREATE POLICY "admin_can_update_orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role IN ('order_staff', 'orders_manager', 'super_admin')
  )
);