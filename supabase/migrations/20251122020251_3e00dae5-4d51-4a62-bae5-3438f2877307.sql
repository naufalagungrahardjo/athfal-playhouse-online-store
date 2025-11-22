-- Enable RLS on collaborators table if not already enabled
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Super admins can view all collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Super admins can insert collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Super admins can update collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Super admins can delete collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Anyone can view collaborators" ON public.collaborators;

-- Allow anyone to view collaborators (public facing)
CREATE POLICY "Anyone can view collaborators"
ON public.collaborators
FOR SELECT
USING (true);

-- Super admins can insert collaborators
CREATE POLICY "Super admins can insert collaborators"
ON public.collaborators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.jwt()->>'email'
    AND admin_accounts.role = 'super_admin'
  )
);

-- Super admins can update collaborators
CREATE POLICY "Super admins can update collaborators"
ON public.collaborators
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.jwt()->>'email'
    AND admin_accounts.role = 'super_admin'
  )
);

-- Super admins can delete collaborators
CREATE POLICY "Super admins can delete collaborators"
ON public.collaborators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts
    WHERE admin_accounts.email = auth.jwt()->>'email'
    AND admin_accounts.role = 'super_admin'
  )
);