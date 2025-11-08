-- Fix banner RLS policies to use auth.email() instead of current_setting
-- Drop existing admin policies
DROP POLICY IF EXISTS "Allow admins to insert banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can update banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can view banners" ON public.banners;

-- Recreate policies with auth.email()
CREATE POLICY "Admins can insert banners"
ON public.banners
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admins can update banners"
ON public.banners
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admins can delete banners"
ON public.banners
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admins can view banners"
ON public.banners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);