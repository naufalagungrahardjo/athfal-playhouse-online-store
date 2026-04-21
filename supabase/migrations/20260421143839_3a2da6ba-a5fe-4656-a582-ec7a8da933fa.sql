UPDATE public.order_items oi
SET product_name = p.name
FROM public.products p
WHERE p.product_id = split_part(oi.product_id, '__', 1)
  AND oi.product_name IS DISTINCT FROM p.name;