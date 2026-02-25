
-- Add slug column to blogs table
ALTER TABLE public.blogs ADD COLUMN slug TEXT NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX idx_blogs_slug ON public.blogs (slug) WHERE slug IS NOT NULL;

-- Auto-generate slugs for existing blogs from their titles
UPDATE public.blogs SET slug = 
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  ) || '-' || LEFT(id, 8);
