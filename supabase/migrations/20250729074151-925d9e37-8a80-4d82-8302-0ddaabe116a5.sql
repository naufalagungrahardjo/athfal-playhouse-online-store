-- Fix RLS policies for order_items table to allow guest checkout

-- First, check if RLS is enabled and disable it temporarily
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert order items (needed for guest checkout)
CREATE POLICY "Allow guest checkout order items" 
ON public.order_items 
FOR INSERT 
TO public
WITH CHECK (true);

-- Allow admin accounts to view all order items
CREATE POLICY "Admin accounts can view all order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
  )
);

-- Allow authenticated users to view their own order items
CREATE POLICY "Users can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Allow admins to update/delete order items
CREATE POLICY "Admin accounts can manage order items" 
ON public.order_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
  )
);