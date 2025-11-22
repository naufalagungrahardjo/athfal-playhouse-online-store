-- Drop the existing "Super admin can manage admin_accounts" policy for ALL
-- and create separate policies for each command for better clarity
DROP POLICY IF EXISTS "Super admin can manage admin_accounts" ON admin_accounts;

-- Allow super admins to view all admin accounts
CREATE POLICY "Super admins can view all admin accounts"
ON admin_accounts
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.email())
);

-- Allow super admins to insert admin accounts
CREATE POLICY "Super admins can insert admin accounts"
ON admin_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.email())
);

-- Allow super admins to update admin accounts
CREATE POLICY "Super admins can update admin accounts"
ON admin_accounts
FOR UPDATE
TO authenticated
USING (
  is_super_admin(auth.email())
)
WITH CHECK (
  is_super_admin(auth.email())
);

-- Allow super admins to delete admin accounts (except super_admins)
CREATE POLICY "Super admins can delete non-super admin accounts"
ON admin_accounts
FOR DELETE
TO authenticated
USING (
  is_super_admin(auth.email()) AND role != 'super_admin'
);