-- Temporarily disable RLS on orders table to test if this is the issue
-- This will help us confirm the RLS is the problem
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- We'll re-enable it with proper policies in the next step