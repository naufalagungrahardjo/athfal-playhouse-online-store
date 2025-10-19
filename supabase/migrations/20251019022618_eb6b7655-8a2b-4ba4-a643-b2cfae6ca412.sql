-- Fix promo_codes RLS policies to use auth.email() and add public read access

-- Drop old policies
DROP POLICY IF EXISTS "Admins can insert promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can update promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can delete promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can view promo_codes" ON promo_codes;

-- Create new policies using auth.email()
CREATE POLICY "Admins can insert promo_codes"
ON promo_codes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admins can update promo_codes"
ON promo_codes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admins can delete promo_codes"
ON promo_codes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admins can view all promo_codes"
ON promo_codes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

-- Add public read access for active promo codes (for checkout validation)
CREATE POLICY "Public can view active promo_codes"
ON promo_codes
FOR SELECT
USING (
  is_active = true
  AND (valid_from IS NULL OR valid_from <= NOW())
  AND (valid_until IS NULL OR valid_until >= NOW())
);