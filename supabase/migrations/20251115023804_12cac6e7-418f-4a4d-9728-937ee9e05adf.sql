-- Fix admin order visibility by updating RLS policies to use auth.email()
-- This ensures admins can see all orders, including those from logged-in users

-- Drop old policies
DROP POLICY IF EXISTS "admin_can_select_orders" ON public.orders;
DROP POLICY IF EXISTS "Admin accounts can view all order items" ON public.order_items;

-- Recreate policies with auth.email() for consistency
CREATE POLICY "admin_can_select_orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admin accounts can view all order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);