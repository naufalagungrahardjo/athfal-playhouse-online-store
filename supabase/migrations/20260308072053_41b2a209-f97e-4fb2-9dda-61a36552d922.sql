
-- Expense categories table
CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expense categories" ON public.expense_categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE admin_accounts.email = auth.email() AND admin_accounts.role IN ('super_admin', 'orders_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE admin_accounts.email = auth.email() AND admin_accounts.role IN ('super_admin', 'orders_manager')));

-- Fund sources table
CREATE TABLE public.expense_fund_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_fund_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fund sources" ON public.expense_fund_sources
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE admin_accounts.email = auth.email() AND admin_accounts.role IN ('super_admin', 'orders_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE admin_accounts.email = auth.email() AND admin_accounts.role IN ('super_admin', 'orders_manager')));

-- Expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  fund_source_id uuid REFERENCES public.expense_fund_sources(id) ON DELETE SET NULL,
  amount integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_accounts WHERE admin_accounts.email = auth.email() AND admin_accounts.role IN ('super_admin', 'orders_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_accounts WHERE admin_accounts.email = auth.email() AND admin_accounts.role IN ('super_admin', 'orders_manager')));
