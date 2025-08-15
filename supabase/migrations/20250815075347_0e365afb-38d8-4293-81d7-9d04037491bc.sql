-- Drop the complex policy and create a simple one for guest orders
DROP POLICY IF EXISTS "Enable order creation for all users" ON orders;

-- Create a simple policy that allows anyone to create orders
CREATE POLICY "Allow anyone to create orders" 
ON orders 
FOR INSERT 
WITH CHECK (true);