-- Fix RLS policy for payment_methods to work with current user context
DROP POLICY IF EXISTS "Admin accounts can insert payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admin accounts can update payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admin accounts can delete payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admin accounts can view payment methods" ON payment_methods;

-- Create new policies that use auth.email() instead of JWT claims
CREATE POLICY "Admin accounts can insert payment methods" 
ON payment_methods 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_accounts 
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admin accounts can update payment methods" 
ON payment_methods 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts 
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admin accounts can delete payment methods" 
ON payment_methods 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts 
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admin accounts can view payment methods" 
ON payment_methods 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts 
    WHERE admin_accounts.email = auth.email()
  )
);