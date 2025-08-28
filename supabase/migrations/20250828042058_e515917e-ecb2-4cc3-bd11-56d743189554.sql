-- First disable RLS temporarily to check if it's an RLS or privilege issue
-- Then re-enable with proper privileges

-- Drop existing restrictive policies that might conflict
DROP POLICY IF EXISTS "users_can_select_own_orders" ON orders;

-- Recreate the policy to allow guest orders (user_id can be null)
CREATE POLICY "users_can_select_own_orders" 
ON orders 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Ensure anon role has INSERT privileges
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT ON public.orders TO anon;
GRANT INSERT, SELECT ON public.order_items TO anon;

-- Also grant to authenticated users
GRANT INSERT, SELECT ON public.orders TO authenticated;
GRANT INSERT, SELECT ON public.order_items TO authenticated;