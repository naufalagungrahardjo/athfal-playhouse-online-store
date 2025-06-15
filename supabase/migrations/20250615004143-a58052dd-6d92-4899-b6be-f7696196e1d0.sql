
-- Create a categories table for CMS-managed product categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT NOT NULL,
  bg_color TEXT NOT NULL DEFAULT 'bg-athfal-yellow/20',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security, default to allowing all actions for admin functionality
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow full access (read/write) to categories for now
CREATE POLICY "Allow all access to categories"
  ON public.categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add to the realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
