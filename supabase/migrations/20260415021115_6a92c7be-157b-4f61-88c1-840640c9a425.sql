CREATE OR REPLACE FUNCTION public.get_order_lookup_token(p_order_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT lookup_token FROM public.orders WHERE id = p_order_id LIMIT 1;
$$;