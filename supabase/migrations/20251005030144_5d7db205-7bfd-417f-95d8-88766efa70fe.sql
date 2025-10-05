-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "public_can_select_recent_guest_orders" ON public.orders;

-- Recreate it as a PERMISSIVE policy (using AS PERMISSIVE)
CREATE POLICY "public_can_select_recent_guest_orders"
ON public.orders
AS PERMISSIVE
FOR SELECT
USING (
  user_id IS NULL
  AND created_at > now() - interval '6 hours'
);