
-- 1. Create an admin_logs table for all CMS actions
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL,
  role public.admin_role NOT NULL,
  action TEXT NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 3. Allow all admins to insert and select logs (but not delete)
CREATE POLICY "Admins can insert/view logs" ON public.admin_logs
  FOR SELECT
  USING (public.is_super_admin(current_setting('request.jwt.claim.email', true))
         OR EXISTS (
           SELECT 1 FROM public.admin_accounts WHERE email = current_setting('request.jwt.claim.email', true)
         ));

CREATE POLICY "Admins can insert logs" ON public.admin_logs
  FOR INSERT
  WITH CHECK (public.is_super_admin(current_setting('request.jwt.claim.email', true))
              OR EXISTS (
                SELECT 1 FROM public.admin_accounts WHERE email = current_setting('request.jwt.claim.email', true)
              ));

-- 4. Only super_admin can delete logs
CREATE POLICY "Super admin can delete logs" ON public.admin_logs
  FOR DELETE
  USING (public.is_super_admin(current_setting('request.jwt.claim.email', true)));
