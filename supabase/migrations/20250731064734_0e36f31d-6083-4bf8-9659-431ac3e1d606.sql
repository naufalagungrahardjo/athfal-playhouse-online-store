-- First, let's clean up all INSERT policies on orders table and create one comprehensive policy
DROP POLICY IF EXISTS "Allow order creation for checkout" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to create orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated guest checkout orders" ON orders;

-- Create a single comprehensive INSERT policy that handles all cases
CREATE POLICY "Enable order creation for all users" 
ON orders 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and setting their own user_id, or if user_id is null (guest checkout)
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  OR
  -- Allow if user is not authenticated (guest checkout) and user_id is null
  (auth.uid() IS NULL AND user_id IS NULL)
);