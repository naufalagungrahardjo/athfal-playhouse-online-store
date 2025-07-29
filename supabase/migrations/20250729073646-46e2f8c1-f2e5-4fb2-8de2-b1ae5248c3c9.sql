-- Fix guest checkout by creating a more permissive policy
-- Drop the current insert policy and create a simpler one

DROP POLICY IF EXISTS "Enable guest checkout inserts" ON public.orders;

-- Create a simple policy that allows anyone to insert orders
-- This is specifically for guest checkout functionality
CREATE POLICY "Allow guest checkout orders" 
ON public.orders 
FOR INSERT 
TO public
WITH CHECK (true);