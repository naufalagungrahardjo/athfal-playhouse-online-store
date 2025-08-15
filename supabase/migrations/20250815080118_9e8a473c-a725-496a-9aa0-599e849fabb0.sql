-- Remove all conflicting INSERT policies
DROP POLICY IF EXISTS "Allow anyone to create orders" ON orders;
DROP POLICY IF EXISTS "Enable guest and user orders" ON orders;

-- Create one simple policy that actually works for guest checkout
CREATE POLICY "Allow order creation" 
ON orders 
FOR INSERT 
WITH CHECK (true);