
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "guest_can_view_order_by_lookup_token" ON public.orders;
DROP POLICY IF EXISTS "guest_can_view_order_items_via_order" ON public.order_items;

-- Create a secure RPC function for guest order lookup
CREATE OR REPLACE FUNCTION public.get_order_by_token(order_id uuid, token uuid)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT * FROM public.orders
  WHERE id = order_id AND lookup_token = token
  LIMIT 1;
$$;

-- Create a secure RPC function for guest order items lookup  
CREATE OR REPLACE FUNCTION public.get_order_items_by_token(order_id uuid, token uuid)
RETURNS SETOF public.order_items
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT oi.* FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.order_id = order_id AND o.lookup_token = token;
$$;

-- Need a SELECT policy that allows the RPC to work for anon/authenticated users
-- Use SECURITY DEFINER on the functions instead so they bypass RLS
DROP FUNCTION IF EXISTS public.get_order_by_token(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_order_items_by_token(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_order_by_token(p_order_id uuid, p_token uuid)
RETURNS TABLE(
  id uuid, user_id uuid, customer_name text, customer_email text, 
  customer_phone text, customer_address text, payment_method text,
  status text, subtotal integer, tax_amount integer, total_amount integer,
  notes text, promo_code text, discount_amount integer, stock_deducted boolean,
  created_at timestamptz, updated_at timestamptz, lookup_token uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT o.id, o.user_id, o.customer_name, o.customer_email,
    o.customer_phone, o.customer_address, o.payment_method,
    o.status, o.subtotal, o.tax_amount, o.total_amount,
    o.notes, o.promo_code, o.discount_amount, o.stock_deducted,
    o.created_at, o.updated_at, o.lookup_token
  FROM public.orders o
  WHERE o.id = p_order_id AND o.lookup_token = p_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_order_items_by_token(p_order_id uuid, p_token uuid)
RETURNS TABLE(
  id uuid, order_id uuid, product_id text, product_name text,
  product_price integer, quantity integer, created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT oi.id, oi.order_id, oi.product_id, oi.product_name,
    oi.product_price, oi.quantity, oi.created_at
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.order_id = p_order_id AND o.lookup_token = p_token;
$$;
