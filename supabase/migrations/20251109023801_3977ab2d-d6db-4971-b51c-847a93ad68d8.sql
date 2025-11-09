-- Fix FAQ RLS policies to use auth.email() instead of current_setting
-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can delete faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can insert faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can update faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can view faqs" ON public.faqs;

-- Recreate policies with auth.email()
CREATE POLICY "Admins can insert faqs"
ON public.faqs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admins can update faqs"
ON public.faqs
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

CREATE POLICY "Admins can delete faqs"
ON public.faqs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);

CREATE POLICY "Admins can view faqs"
ON public.faqs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.email()
  )
);