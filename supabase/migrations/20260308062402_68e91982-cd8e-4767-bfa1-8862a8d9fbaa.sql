ALTER TABLE public.products ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN is_sold_out boolean NOT NULL DEFAULT false;