-- Let's also check and fix the order_items RLS policy to ensure it works for guest checkout
DROP POLICY IF EXISTS "Allow guest checkout order items" ON order_items;

-- Create a more permissive policy for order_items during checkout
CREATE POLICY "Enable order items creation for checkout" 
ON order_items 
FOR INSERT 
WITH CHECK (true);