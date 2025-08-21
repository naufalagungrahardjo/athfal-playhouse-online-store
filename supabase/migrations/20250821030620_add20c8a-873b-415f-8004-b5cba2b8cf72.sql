-- Completely reset and rebuild RLS policies for orders table with proper type casting
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Admin accounts can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Order staff and managers can update orders" ON orders;  
DROP POLICY IF EXISTS "Super admin can delete orders" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_select_admin" ON orders;
DROP POLICY IF EXISTS "orders_select_user" ON orders;
DROP POLICY IF EXISTS "orders_update_admin" ON orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON orders;

-- Temporarily disable RLS to clear any cached policies
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible INSERT policy that works for everyone
CREATE POLICY "allow_all_inserts" 
ON orders 
FOR INSERT 
WITH CHECK (true);

-- Create policies for other operations with proper type casting
CREATE POLICY "admin_can_select_orders" 
ON orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM admin_accounts 
  WHERE email = current_setting('request.jwt.claim.email', true)
));

CREATE POLICY "users_can_select_own_orders" 
ON orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "admin_can_update_orders" 
ON orders 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM admin_accounts 
  WHERE email = current_setting('request.jwt.claim.email', true) 
  AND role = ANY (ARRAY['order_staff'::admin_role, 'orders_manager'::admin_role, 'super_admin'::admin_role])
));

CREATE POLICY "super_admin_can_delete_orders" 
ON orders 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM admin_accounts 
  WHERE email = current_setting('request.jwt.claim.email', true) 
  AND role = 'super_admin'::admin_role
));