-- Fix RLS policies for orders table to allow guest checkout

-- First, drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Anyone can insert orders for guest checkout" ON public.orders;
DROP POLICY IF EXISTS "Orders - Update for order_staff (all fields, trigger restricts)" ON public.orders;

-- Create comprehensive policies for orders table
-- 1. Allow guest checkout (any unauthenticated user can insert orders)
CREATE POLICY "Enable guest checkout inserts" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- 2. Allow admin accounts to view all orders
CREATE POLICY "Admin accounts can view all orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
  )
);

-- 3. Allow order staff to update orders (with trigger restrictions)
CREATE POLICY "Order staff can update orders" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    AND admin_accounts.role = 'order_staff'
  )
);

-- 4. Allow super admins to delete orders
CREATE POLICY "Super admin can delete orders" 
ON public.orders 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    AND admin_accounts.role = 'super_admin'
  )
);

-- 5. Allow authenticated users to view their own orders (if user_id is set)
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;