
-- 1) Hide internal MDR rate from anonymous viewers
REVOKE SELECT (mdr_rate) ON public.payment_methods FROM anon;

-- 2) Restrict images bucket uploads to admin roles only (exclude teachers)
DROP POLICY IF EXISTS "Only admins can upload images" ON storage.objects;
CREATE POLICY "Only admins can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'images'
  AND EXISTS (
    SELECT 1 FROM public.admin_accounts a
    WHERE a.email = auth.email()
      AND a.role IN ('super_admin','content_manager','content_staff','orders_manager','order_staff')
  )
);

-- 3) Revoke EXECUTE on internal/trigger/admin-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.auto_mark_order_paid() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_parent_message_activity() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_stock_on_order_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_stock_on_processing() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_attendance_on_checkin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restrict_order_staff_update() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_new_auth_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_order_amount_paid() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_totals() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_mdr_expense_for_order(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_stock_for_order(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_stock_for_order(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_program_session_date(uuid, date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_student_from_child_name(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_session_number(uuid, date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_enroll_order_to_active_programs(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_cancel_stale_orders() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_storage_usage() FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_teacher_recipients() FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_promo_usage(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_order_lookup_token(uuid) FROM anon, authenticated;
