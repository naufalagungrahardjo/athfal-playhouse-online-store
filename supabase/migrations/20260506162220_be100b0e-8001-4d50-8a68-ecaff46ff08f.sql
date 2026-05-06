-- Remove orphaned billing notice assignments (where the linked order was deleted)
DELETE FROM public.billing_notice_assignments a
WHERE NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = a.order_id);

-- Ensure future order deletions auto-remove assignments
ALTER TABLE public.billing_notice_assignments
  DROP CONSTRAINT IF EXISTS billing_notice_assignments_order_id_fkey;

ALTER TABLE public.billing_notice_assignments
  ADD CONSTRAINT billing_notice_assignments_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;