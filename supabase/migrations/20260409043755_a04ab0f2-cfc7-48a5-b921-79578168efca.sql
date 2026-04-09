ALTER TABLE public.capital_inflows 
  ADD COLUMN type text NOT NULL DEFAULT 'inflow',
  ADD COLUMN from_fund_source_id uuid REFERENCES public.expense_fund_sources(id) ON DELETE SET NULL;