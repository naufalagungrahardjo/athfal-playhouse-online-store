-- Add permissive UPDATE policy for products using auth.email()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'update_products_auth_email'
  ) THEN
    CREATE POLICY update_products_auth_email
    ON public.products
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_accounts a
        WHERE a.email = auth.email()
          AND a.role IN ('super_admin','orders_manager','order_staff')
      )
    );
  END IF;
END $$;

-- Add permissive INSERT policy for admin_logs using auth.email()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_logs' AND policyname = 'insert_admin_logs_auth_email'
  ) THEN
    CREATE POLICY insert_admin_logs_auth_email
    ON public.admin_logs
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.admin_accounts a
        WHERE a.email = auth.email()
      )
      OR public.is_super_admin(auth.email())
    );
  END IF;
END $$;