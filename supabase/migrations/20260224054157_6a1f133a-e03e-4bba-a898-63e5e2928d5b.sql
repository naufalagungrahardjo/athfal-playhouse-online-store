-- Drop overly permissive guest order policies that don't validate lookup_token value
DROP POLICY IF EXISTS "guest_can_view_order_items_via_order" ON public.order_items;
DROP POLICY IF EXISTS "public_can_view_recent_guest_order_items" ON public.order_items;
DROP POLICY IF EXISTS "guest_can_view_order_by_lookup_token" ON public.orders;