-- Fix RLS for guest checkout by creating explicit guest policy
DROP POLICY IF EXISTS "allow_all_inserts" ON orders;

-- Create a more explicit policy that allows both authenticated and guest users
CREATE POLICY "allow_all_order_creation" 
ON orders 
FOR INSERT 
WITH CHECK (true);

-- Grant INSERT permission explicitly to public role
GRANT INSERT ON orders TO anon;