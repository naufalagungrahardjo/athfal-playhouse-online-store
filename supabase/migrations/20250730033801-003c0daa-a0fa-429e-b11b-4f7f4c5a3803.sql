-- CRITICAL SECURITY FIXES
-- Phase 1: Fix critical RLS vulnerabilities

-- 1. Fix orders table RLS (currently disabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies and recreate secure ones
DROP POLICY IF EXISTS "Allow guest checkout orders" ON public.orders;
DROP POLICY IF EXISTS "Admin accounts can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Order staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Super admin can delete orders" ON public.orders;

-- Recreate secure order policies
CREATE POLICY "Allow authenticated guest checkout orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin accounts can view all orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
  )
);

CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Order staff and managers can update orders" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    AND admin_accounts.role IN ('order_staff', 'orders_manager', 'super_admin')
  )
);

CREATE POLICY "Super admin can delete orders" 
ON public.orders 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    AND admin_accounts.role = 'super_admin'
  )
);

-- 2. Secure collaborators table (currently no RLS)
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view collaborators" 
ON public.collaborators 
FOR SELECT 
USING (true);

CREATE POLICY "Admin accounts can manage collaborators" 
ON public.collaborators 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    AND admin_accounts.role IN ('content_manager', 'content_staff', 'super_admin')
  )
);

-- 3. Secure about_content table (currently no RLS)
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view about content" 
ON public.about_content 
FOR SELECT 
USING (true);

CREATE POLICY "Content managers can update about content" 
ON public.about_content 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
    AND admin_accounts.role IN ('content_manager', 'super_admin')
  )
);

-- 4. Fix storage policies to be more secure
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;

-- More secure storage policies
CREATE POLICY "Public can view images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin accounts can manage all images" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE admin_accounts.email = current_setting('request.jwt.claim.email', true)
  )
);

-- 5. Fix function security settings
CREATE OR REPLACE FUNCTION public.is_admin_account(email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE public.admin_accounts.email = $1
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE public.admin_accounts.email = $1
      AND public.admin_accounts.role = 'super_admin'
  );
$function$;