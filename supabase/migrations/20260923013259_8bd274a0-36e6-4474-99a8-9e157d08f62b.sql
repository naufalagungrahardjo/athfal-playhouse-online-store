
-- Remove duplicate public read policies
DROP POLICY IF EXISTS "Anyone can view about content" ON public.about_content;
DROP POLICY IF EXISTS "Public can view about content" ON public.about_content;
CREATE POLICY "Public can view about content" ON public.about_content
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Public can view collaborators" ON public.collaborators;
CREATE POLICY "Public can view collaborators" ON public.collaborators
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Website copy is publicly readable" ON public.website_copy;
CREATE POLICY "Website copy is publicly readable" ON public.website_copy
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view published faqs" ON public.faqs;
CREATE POLICY "Public can view published faqs" ON public.faqs
  FOR SELECT TO anon, authenticated USING (true);

-- Testimonials: only active ones are public
DROP POLICY IF EXISTS "Public read access" ON public.testimonials;
CREATE POLICY "Public can view active testimonials" ON public.testimonials
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins can view all testimonials" ON public.testimonials
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email()));

-- Product child tables: only for visible products
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view variants of visible products" ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND COALESCE(p.is_hidden, false) = false));
CREATE POLICY "Admins can view all product variants" ON public.product_variants
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email()));

DROP POLICY IF EXISTS "Public can view product sessions" ON public.product_sessions;
CREATE POLICY "Public can view sessions of visible products" ON public.product_sessions
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_sessions.product_id AND COALESCE(p.is_hidden, false) = false));
CREATE POLICY "Admins can view all product sessions" ON public.product_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email()));

DROP POLICY IF EXISTS "Public can view installment plans" ON public.product_installment_plans;
CREATE POLICY "Public can view plans of visible products" ON public.product_installment_plans
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_installment_plans.product_id AND COALESCE(p.is_hidden, false) = false));
CREATE POLICY "Admins can view all installment plans" ON public.product_installment_plans
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_accounts a WHERE a.email = auth.email()));
