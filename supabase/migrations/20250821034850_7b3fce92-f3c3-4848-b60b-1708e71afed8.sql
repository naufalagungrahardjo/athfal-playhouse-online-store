-- Drop existing policies on orders table
DROP POLICY IF EXISTS "admin_can_select_orders" ON orders;
DROP POLICY IF EXISTS "admin_can_update_orders" ON orders;
DROP POLICY IF EXISTS "allow_all_inserts" ON orders;
DROP POLICY IF EXISTS "super_admin_can_delete_orders" ON orders;
DROP POLICY IF EXISTS "users_can_select_own_orders" ON orders;

-- Temporarily disable RLS to clear any cached policies
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create the corrected policies with proper type casting
CREATE POLICY "allow_all_inserts" 
ON orders 
FOR INSERT 
WITH CHECK (true);

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