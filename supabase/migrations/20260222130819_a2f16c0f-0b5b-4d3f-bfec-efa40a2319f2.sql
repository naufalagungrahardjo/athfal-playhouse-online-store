
-- Revoke ALL and grant only necessary privileges
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.order_items FROM anon;

-- Grant only INSERT and SELECT for guest checkout
GRANT INSERT, SELECT ON public.orders TO anon;
GRANT INSERT, SELECT ON public.order_items TO anon;
