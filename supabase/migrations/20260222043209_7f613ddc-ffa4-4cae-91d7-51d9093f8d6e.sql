
ALTER TABLE public.products
ADD COLUMN first_payment integer NOT NULL DEFAULT 0,
ADD COLUMN installment integer NOT NULL DEFAULT 0;
