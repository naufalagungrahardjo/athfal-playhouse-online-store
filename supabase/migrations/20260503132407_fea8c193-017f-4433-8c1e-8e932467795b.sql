CREATE POLICY "Admins can update billing notice assignments"
ON public.billing_notice_assignments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role IN ('super_admin','orders_manager','order_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role IN ('super_admin','orders_manager','order_staff')
  )
);