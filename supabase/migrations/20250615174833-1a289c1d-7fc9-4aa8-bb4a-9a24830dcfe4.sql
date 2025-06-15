
-- Remove all existing policies on orders (clean slate)
DROP POLICY IF EXISTS "Anyone can insert orders for guest checkout" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can manage their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow any other existing policy" ON public.orders;

-- Ensure RLS is enabled for table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Add a single, wide open policy: Anyone can insert for guest checkout (even no login)
CREATE POLICY "Anyone can insert orders for guest checkout"
  ON public.orders
  FOR INSERT
  WITH CHECK (true);
