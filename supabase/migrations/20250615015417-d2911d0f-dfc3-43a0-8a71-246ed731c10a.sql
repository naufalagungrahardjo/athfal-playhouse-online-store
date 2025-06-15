
-- 1. Add order_num column to categories for explicit ordering
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS order_num integer NOT NULL DEFAULT 1;

-- 2. Set order_num sequentially for all existing categories based on creation time
DO $$
DECLARE
  rec RECORD;
  i integer := 1;
BEGIN
  FOR rec IN SELECT id FROM public.categories ORDER BY created_at ASC
  LOOP
    UPDATE public.categories SET order_num = i WHERE id = rec.id;
    i := i + 1;
  END LOOP;
END
$$;
