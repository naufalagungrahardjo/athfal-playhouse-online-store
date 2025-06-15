
-- Create about_content table for storing About Us content
CREATE TABLE public.about_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- (Optional) Future RLS: Table is public CMS so no policies for now.
