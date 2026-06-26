-- Table to hold shareable expense-entry links (tokens)
CREATE TABLE public.expense_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_share_links TO authenticated;
GRANT ALL ON public.expense_share_links TO service_role;

ALTER TABLE public.expense_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage expense share links"
  ON public.expense_share_links
  FOR ALL
  USING (public.is_admin_account(auth.email()))
  WITH CHECK (public.is_admin_account(auth.email()));

CREATE TRIGGER update_expense_share_links_updated_at
  BEFORE UPDATE ON public.expense_share_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Validate a share token
CREATE OR REPLACE FUNCTION public.is_valid_expense_share_token(p_token uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.expense_share_links
    WHERE token = p_token AND is_active = true
  );
$$;

-- Public: read expense data through a valid token
CREATE OR REPLACE FUNCTION public.get_expense_share_data(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_valid_expense_share_token(p_token) THEN
    RAISE EXCEPTION 'Invalid or expired link';
  END IF;

  SELECT jsonb_build_object(
    'categories', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name) ORDER BY name), '[]'::jsonb)
      FROM public.expense_categories
    ),
    'fund_sources', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name) ORDER BY name), '[]'::jsonb)
      FROM public.expense_fund_sources
    ),
    'expenses', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'description', description,
        'category_id', category_id,
        'fund_source_id', fund_source_id,
        'amount', amount,
        'discount', discount,
        'date', date,
        'created_at', created_at
      ) ORDER BY created_at DESC), '[]'::jsonb)
      FROM public.expenses
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Public: add an expense through a valid token
CREATE OR REPLACE FUNCTION public.add_expense_via_share(
  p_token uuid,
  p_description text,
  p_amount integer,
  p_category_id uuid DEFAULT NULL,
  p_fund_source_id uuid DEFAULT NULL,
  p_discount integer DEFAULT 0,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_valid_expense_share_token(p_token) THEN
    RAISE EXCEPTION 'Invalid or expired link';
  END IF;

  IF p_description IS NULL OR length(trim(p_description)) = 0 THEN
    RAISE EXCEPTION 'Description is required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'A valid amount is required';
  END IF;

  INSERT INTO public.expenses (description, amount, category_id, fund_source_id, discount, date)
  VALUES (
    trim(p_description),
    p_amount,
    p_category_id,
    p_fund_source_id,
    GREATEST(0, COALESCE(p_discount, 0)),
    COALESCE(p_date, CURRENT_DATE)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Admin: get the currently active share link
CREATE OR REPLACE FUNCTION public.get_active_expense_share_link()
RETURNS TABLE(token uuid, is_active boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT l.token, l.is_active, l.created_at
  FROM public.expense_share_links l
  WHERE public.is_admin_account(auth.email())
    AND l.is_active = true
  ORDER BY l.created_at DESC
  LIMIT 1;
$$;

-- Admin: deactivate existing links and create a fresh one
CREATE OR REPLACE FUNCTION public.regenerate_expense_share_link()
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_token uuid;
BEGIN
  IF NOT public.is_admin_account(auth.email()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.expense_share_links SET is_active = false, updated_at = now() WHERE is_active = true;

  INSERT INTO public.expense_share_links (created_by)
  VALUES (auth.email())
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;

-- Admin: revoke all active links
CREATE OR REPLACE FUNCTION public.revoke_expense_share_link()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin_account(auth.email()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.expense_share_links SET is_active = false, updated_at = now() WHERE is_active = true;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_valid_expense_share_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_share_data(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_expense_via_share(uuid, text, integer, uuid, uuid, integer, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_expense_share_link() TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_expense_share_link() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_expense_share_link() TO authenticated;