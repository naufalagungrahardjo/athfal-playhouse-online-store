
-- Create capital_inflows table
CREATE TABLE public.capital_inflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  detail TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  fund_source_id UUID REFERENCES public.expense_fund_sources(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.capital_inflows ENABLE ROW LEVEL SECURITY;

-- RLS: Admins (super_admin & orders_manager) can manage
CREATE POLICY "Admins can manage capital_inflows"
ON public.capital_inflows
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
