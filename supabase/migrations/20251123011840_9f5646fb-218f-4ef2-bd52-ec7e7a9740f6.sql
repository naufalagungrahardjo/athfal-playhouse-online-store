-- Add media field to products table to support multiple images and videos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.media IS 'Array of media objects with url and type (image/video) fields';

-- Migrate existing image data to media field (only for products that have media array empty)
UPDATE public.products 
SET media = jsonb_build_array(
  jsonb_build_object('url', image, 'type', 'image')
)
WHERE media = '[]'::jsonb AND image IS NOT NULL AND image != '';