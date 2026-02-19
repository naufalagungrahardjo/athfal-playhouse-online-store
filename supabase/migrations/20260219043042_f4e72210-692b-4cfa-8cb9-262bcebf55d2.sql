
-- ISSUE 1: Drop dangerous password column from users table
ALTER TABLE public.users ALTER COLUMN password SET DEFAULT '';
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;

-- Update sync_new_auth_user() to stop inserting password
CREATE OR REPLACE FUNCTION public.sync_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name, password, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', ''), 
    '', 
    now(), 
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- ISSUE 2: Remove public guest order exposure policies
DROP POLICY IF EXISTS "public_can_select_recent_guest_orders" ON public.orders;
DROP POLICY IF EXISTS "public_can_view_recent_guest_order_items" ON public.order_items;

-- Add lookup_token column for secure guest order access
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lookup_token uuid DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_lookup_token ON public.orders(lookup_token);

-- Allow guest order lookup only via exact token match
CREATE POLICY "guest_can_view_order_by_token" ON public.orders
FOR SELECT USING (
  lookup_token IS NOT NULL
  AND lookup_token = (current_setting('request.headers', true)::json->>'x-order-token')::uuid
);

-- Allow guest order items lookup via token
CREATE POLICY "guest_can_view_order_items_by_token" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.lookup_token IS NOT NULL
    AND orders.lookup_token = (current_setting('request.headers', true)::json->>'x-order-token')::uuid
  )
);
