
-- Create table to store website copy content
CREATE TABLE public.website_copy (
  id text NOT NULL DEFAULT 'main' PRIMARY KEY,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_copy ENABLE ROW LEVEL SECURITY;

-- Anyone can read website copy (it's public content)
CREATE POLICY "Website copy is publicly readable"
  ON public.website_copy FOR SELECT
  USING (true);

-- Only authenticated admin users can update
CREATE POLICY "Admins can update website copy"
  ON public.website_copy FOR UPDATE
  USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert website copy"
  ON public.website_copy FOR INSERT
  WITH CHECK (public.is_admin_user(auth.uid()));

-- Seed with default row
INSERT INTO public.website_copy (id, content) VALUES ('main', '{}'::jsonb);
