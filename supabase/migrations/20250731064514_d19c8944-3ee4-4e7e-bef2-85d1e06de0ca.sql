-- Fix RLS policy for orders to allow both authenticated and guest checkouts
DROP POLICY IF EXISTS "Allow authenticated guest checkout orders" ON orders;

-- Create new policy that allows anyone to insert orders (for guest checkout)
CREATE POLICY "Allow order creation for checkout" 
ON orders 
FOR INSERT 
WITH CHECK (true);

-- Also ensure users can insert orders for themselves when authenticated
CREATE POLICY "Allow authenticated users to create orders" 
ON orders 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);