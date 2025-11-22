-- Enable RLS on about_content table if not already enabled
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view about content" ON public.about_content;
DROP POLICY IF EXISTS "Super admins can insert about content" ON public.about_content;
DROP POLICY IF EXISTS "Super admins can update about content" ON public.about_content;
DROP POLICY IF EXISTS "Content managers can insert about content" ON public.about_content;
DROP POLICY IF EXISTS "Content managers can update about content" ON public.about_content;

-- Allow anyone to view about content (public facing)
CREATE POLICY "Anyone can view about content"
ON public.about_content
FOR SELECT
USING (true);

-- Super admins and content managers can insert about content
CREATE POLICY "Admins can insert about content"
ON public.about_content
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.jwt()->>'email'
    AND admin_accounts.role IN ('super_admin', 'content_manager', 'content_staff')
  )
);

-- Super admins and content managers can update about content
CREATE POLICY "Admins can update about content"
ON public.about_content
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.jwt()->>'email'
    AND admin_accounts.role IN ('super_admin', 'content_manager', 'content_staff')
  )
);