-- Completely reset and rebuild RLS policies for orders table
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Admin accounts can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Order staff and managers can update orders" ON orders;  
DROP POLICY IF EXISTS "Super admin can delete orders" ON orders;

-- Temporarily disable RLS to clear any cached policies
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create brand new simple policies
CREATE POLICY "orders_insert_policy" 
ON orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "orders_select_admin" 
ON orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_accounts 
  WHERE email = current_setting('request.jwt.claim.email', true)
));

CREATE POLICY "orders_select_user" 
ON orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "orders_update_admin" 
ON orders 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM admin_accounts 
  WHERE email = current_setting('request.jwt.claim.email', true) 
  AND role = ANY (ARRAY['order_staff', 'orders_manager', 'super_admin'])
));

CREATE POLICY "orders_delete_admin" 
ON orders 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM admin_accounts 
  WHERE email = current_setting('request.jwt.claim.email', true) 
  AND role = 'super_admin'
));