-- Drop duplicate overly-permissive policies on testimonials
-- These are duplicates of properly role-scoped policies already in place
DROP POLICY IF EXISTS "Admins can delete " ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert " ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update " ON public.testimonials;