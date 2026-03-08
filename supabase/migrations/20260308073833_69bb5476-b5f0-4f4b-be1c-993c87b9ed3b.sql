
CREATE TABLE public.other_income (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  fund_source_id uuid REFERENCES public.expense_fund_sources(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.other_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage other income"
  ON public.other_income
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'orders_manager')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE admin_accounts.email = auth.email()
    AND admin_accounts.role IN ('super_admin', 'orders_manager')
  ));
