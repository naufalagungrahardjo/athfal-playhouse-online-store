-- Fix RLS policy on admin_accounts to allow users to read their own admin status
DROP POLICY IF EXISTS "Users can read admin accounts" ON admin_accounts;

CREATE POLICY "Users can read own admin status" 
ON admin_accounts 
FOR SELECT 
TO authenticated 
USING (email = auth.jwt()->>'email');