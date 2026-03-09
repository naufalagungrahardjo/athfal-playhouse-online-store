-- Add MDR rate column to payment_methods table (percentage, default 0%)
ALTER TABLE public.payment_methods 
ADD COLUMN mdr_rate numeric(5,2) NOT NULL DEFAULT 0;