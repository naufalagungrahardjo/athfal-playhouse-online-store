
-- Fix EDUPLAY stock: was 1, sold 3 in completed orders, should be GREATEST(0, 1-3) = 0
UPDATE public.products SET stock = 0, updated_at = now() WHERE product_id = 'EDUPLAY';

-- Mark those completed orders as stock_deducted
UPDATE public.orders SET stock_deducted = true, updated_at = now() 
WHERE status IN ('completed', 'processing') AND stock_deducted = false;
