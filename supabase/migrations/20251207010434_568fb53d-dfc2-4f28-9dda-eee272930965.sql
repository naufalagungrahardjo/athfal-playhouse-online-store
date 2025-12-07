-- Drop the existing delete policy for orders
DROP POLICY IF EXISTS "super_admin_can_delete_orders" ON public.orders;

-- Create new delete policy allowing super_admin and orders_manager to delete orders
CREATE POLICY "super_admin_orders_manager_can_delete_orders" 
ON public.orders 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role IN ('super_admin', 'orders_manager')
  )
);

-- Add delete policy for order_items (super_admin and orders_manager only)
DROP POLICY IF EXISTS "Admin can delete order items" ON public.order_items;

CREATE POLICY "super_admin_orders_manager_can_delete_order_items" 
ON public.order_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
      AND admin_accounts.role IN ('super_admin', 'orders_manager')
  )
);