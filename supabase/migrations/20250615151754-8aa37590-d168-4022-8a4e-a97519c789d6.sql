
-- Fix performance warnings: wrap current_setting() in SELECT in RLS policies

-- 1. Orders: Orders - Update for order_staff (all fields, trigger restricts)
DROP POLICY IF EXISTS "Orders - Update for order_staff (all fields, trigger restricts)" ON public.orders;
CREATE POLICY "Orders - Update for order_staff (all fields, trigger restricts)" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE email = (SELECT current_setting('request.jwt.claim.email', true))
      AND role = 'order_staff'
    )
  );

-- 2. admin_logs: Super admin can delete logs
DROP POLICY IF EXISTS "Super admin can delete logs" ON public.admin_logs;
CREATE POLICY "Super admin can delete logs" ON public.admin_logs
  FOR DELETE
  USING (public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true))));

-- 3. admin_logs: Admins can insert/view logs
DROP POLICY IF EXISTS "Admins can insert/view logs" ON public.admin_logs;
CREATE POLICY "Admins can insert/view logs" ON public.admin_logs
  FOR SELECT
  USING (
    public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true)))
    OR EXISTS (
         SELECT 1 FROM public.admin_accounts WHERE email = (SELECT current_setting('request.jwt.claim.email', true))
    )
  );

-- 4. admin_logs: Admins can insert logs
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;
CREATE POLICY "Admins can insert logs" ON public.admin_logs
  FOR INSERT
  WITH CHECK (
    public.is_super_admin((SELECT current_setting('request.jwt.claim.email', true)))
    OR EXISTS (
         SELECT 1 FROM public.admin_accounts WHERE email = (SELECT current_setting('request.jwt.claim.email', true))
    )
  );

-- 5. Example users table (If you use auth.uid() or current_setting() in RLS on users, fix by wrapping in SELECT)
-- If you have: USING (auth.uid() = id)
-- Use: USING ((SELECT auth.uid()) = id)
-- If you have an example like:
-- DROP POLICY IF EXISTS "User can delete own account" ON public.users;
-- CREATE POLICY "User can delete own account" ON public.users
--   FOR DELETE USING ((SELECT auth.uid()) = id);

