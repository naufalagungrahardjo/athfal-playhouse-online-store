-- Add permissive DELETE policy for products using auth.email()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'delete_products_auth_email'
  ) THEN
    CREATE POLICY delete_products_auth_email
    ON public.products
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.admin_accounts a
        WHERE a.email = auth.email()
          AND a.role IN ('super_admin','orders_manager')
      )
    );
  END IF;
END $$;