-- Clean up existing slugs by removing the appended ID suffix pattern (-blog_XXX...)
UPDATE public.blogs SET slug = 
  REGEXP_REPLACE(slug, '-blog_[0-9]+$', '', 'g');

-- Also clean up any trailing hyphens left over
UPDATE public.blogs SET slug = 
  REGEXP_REPLACE(slug, '-+$', '', 'g');
