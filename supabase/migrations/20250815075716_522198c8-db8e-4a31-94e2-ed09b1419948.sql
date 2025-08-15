-- Re-enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create a proper policy that allows guest orders but maintains security
CREATE POLICY "Enable guest and user orders" 
ON orders 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and user_id matches
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
  OR 
  -- Allow guest orders (user_id can be null)
  (user_id IS NULL)
);