
-- Fix stock for order 57b16b2d that wasn't deducted properly
-- Reset the flag so the function can run
UPDATE public.orders SET stock_deducted = false WHERE id = '57b16b2d-3989-4b5a-85d5-ea93cc97faaa';

-- Now run the deduction
SELECT public.deduct_stock_for_order('57b16b2d-3989-4b5a-85d5-ea93cc97faaa'::uuid);

-- Also fix the earlier order that had same issue
UPDATE public.orders SET stock_deducted = false WHERE id = '6ea598e1-c6da-4c36-a30f-3356bcd606a8';
SELECT public.deduct_stock_for_order('6ea598e1-c6da-4c36-a30f-3356bcd606a8'::uuid);
