-- FIX 1: payment_methods_mdr_rate_public_read
-- Revoke column-level SELECT on the sensitive mdr_rate from anon/authenticated.
-- The public app never selects mdr_rate, and admins read it via the
-- SECURITY DEFINER function get_admin_payment_methods(), so this is safe.
REVOKE SELECT (mdr_rate) ON public.payment_methods FROM anon;
REVOKE SELECT (mdr_rate) ON public.payment_methods FROM authenticated;

-- FIX 2: orders_insert_no_restriction_guest_token_enumerable
-- Replace the wide-open INSERT policy with one that enforces ownership and
-- basic input validation at the RLS layer (guest checkout stays supported).
DROP POLICY IF EXISTS allow_all_order_creation ON public.orders;

CREATE POLICY allow_all_order_creation
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  -- Ownership: guests insert with NULL user_id, authenticated users insert
  -- their own rows; trusted admins are unrestricted.
  (user_id IS NULL OR user_id = auth.uid() OR public.is_admin_account(auth.email()))
  AND (
    public.is_admin_account(auth.email())
    OR (
      customer_name IS NOT NULL
      AND length(trim(customer_name)) >= 2
      AND customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      AND customer_phone IS NOT NULL
      AND length(regexp_replace(customer_phone, '\D', '', 'g')) >= 7
      AND subtotal >= 0
      AND tax_amount >= 0
      AND total_amount >= 0
      AND total_amount <= 100000000
    )
  )
);