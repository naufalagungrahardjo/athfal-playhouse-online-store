
ALTER TABLE public.products
  ADD COLUMN active_from timestamp with time zone DEFAULT now(),
  ADD COLUMN active_until timestamp with time zone DEFAULT NULL;
