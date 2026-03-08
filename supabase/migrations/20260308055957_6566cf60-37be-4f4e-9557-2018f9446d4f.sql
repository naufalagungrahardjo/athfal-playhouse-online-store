
-- Fix the existing order: reset stock_deducted so the RPC can properly deduct
UPDATE public.orders SET stock_deducted = false WHERE id = '19e5926e-c586-444c-8ba3-6a9dd5d6eb18';

-- Now manually deduct stock for the 2 items (total qty 10 for TAHSIN_2)
UPDATE public.products SET stock = GREATEST(0, stock - 10), updated_at = now() WHERE product_id = 'TAHSIN_2';

-- Mark as deducted
UPDATE public.orders SET stock_deducted = true, updated_at = now() WHERE id = '19e5926e-c586-444c-8ba3-6a9dd5d6eb18';
