
-- Fix 1: Remove guest order exposure via user_id IS NULL
DROP POLICY IF EXISTS "users_can_select_own_orders" ON public.orders;

CREATE POLICY "users_can_select_own_orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Fix 2: Remove overly permissive storage policies for images bucket
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
