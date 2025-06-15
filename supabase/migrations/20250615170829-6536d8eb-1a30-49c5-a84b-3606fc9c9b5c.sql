
-- Add a schedule column to enable per-product schedule. Use jsonb so we can store arrays (for multiple schedule blocks), but you can use text if you want only freeform text.

ALTER TABLE public.products
ADD COLUMN schedule jsonb;

-- (Optional, but helps) Set default value to null
ALTER TABLE public.products
ALTER COLUMN schedule SET DEFAULT NULL;
