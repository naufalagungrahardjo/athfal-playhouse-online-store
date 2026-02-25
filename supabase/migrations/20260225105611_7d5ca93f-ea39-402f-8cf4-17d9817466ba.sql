
-- Remove overly permissive policies on testimonials that use USING(true)/WITH CHECK(true)
DROP POLICY IF EXISTS "Admins can delete" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update" ON public.testimonials;
