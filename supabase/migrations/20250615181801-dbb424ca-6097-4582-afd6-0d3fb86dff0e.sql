
-- Remove any broken/old insert policy first
DROP POLICY IF EXISTS "Allow admins to insert banners" ON public.banners;

-- Create INSERT policy for admins using WITH CHECK (not USING!)
CREATE POLICY "Allow admins to insert banners"
  ON public.banners
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

-- (Leave the UPDATE and DELETE policies as written, since they use USING and are valid.)
