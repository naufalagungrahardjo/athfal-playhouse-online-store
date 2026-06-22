CREATE OR REPLACE FUNCTION public.can_view_financials()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND (
        a.role IN ('super_admin'::admin_role, 'orders_manager'::admin_role)
        OR a.allowed_menus && ARRAY['/admin/analytics','/admin/expense','/admin/other-income']::text[]
      )
  );
$$;

CREATE POLICY "Financial viewers can read expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (public.can_view_financials());

CREATE POLICY "Financial viewers can read expense categories"
  ON public.expense_categories FOR SELECT
  TO authenticated
  USING (public.can_view_financials());

CREATE POLICY "Financial viewers can read fund sources"
  ON public.expense_fund_sources FOR SELECT
  TO authenticated
  USING (public.can_view_financials());

CREATE POLICY "Financial viewers can read other income"
  ON public.other_income FOR SELECT
  TO authenticated
  USING (public.can_view_financials());

CREATE POLICY "Financial viewers can read capital inflows"
  ON public.capital_inflows FOR SELECT
  TO authenticated
  USING (public.can_view_financials());