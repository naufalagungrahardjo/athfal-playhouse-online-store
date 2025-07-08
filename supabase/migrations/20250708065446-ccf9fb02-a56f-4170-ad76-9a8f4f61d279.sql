-- Fix all admin RLS policies for missing tables

-- 1. FAQs table - Add complete admin policies
CREATE POLICY "Admins can view faqs" ON public.faqs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Admins can insert faqs" ON public.faqs
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Admins can update faqs" ON public.faqs
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Admins can delete faqs" ON public.faqs
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

-- 2. Promo codes table - Add complete admin policies
CREATE POLICY "Admins can view promo_codes" ON public.promo_codes
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Admins can insert promo_codes" ON public.promo_codes
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Admins can update promo_codes" ON public.promo_codes
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Admins can delete promo_codes" ON public.promo_codes
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

-- 3. Banners table - Add missing UPDATE and DELETE policies
CREATE POLICY "Admins can view banners" ON public.banners
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Admins can update banners" ON public.banners
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

CREATE POLICY "Admins can delete banners" ON public.banners
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts
      WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    )
  );

-- 4. Public access policies for front-end viewing
CREATE POLICY "Public can view active banners" ON public.banners
  FOR SELECT 
  USING (active = true);

CREATE POLICY "Public can view published faqs" ON public.faqs
  FOR SELECT 
  USING (true);