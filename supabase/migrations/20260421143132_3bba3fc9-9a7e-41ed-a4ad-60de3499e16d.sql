UPDATE public.order_items oi
SET product_name = p.name
FROM public.products p
WHERE oi.product_id = p.product_id
  AND oi.product_name IS DISTINCT FROM p.name;