
-- Create the testimonials table (if not yet created, skip if it already exists)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  text text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  avatar text,
  active boolean NOT NULL DEFAULT true,
  order_num integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS and create correct policies
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can insert" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can delete" ON public.testimonials;

CREATE POLICY "Public read access" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Admins can insert" ON public.testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update" ON public.testimonials FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete" ON public.testimonials FOR DELETE USING (true);
