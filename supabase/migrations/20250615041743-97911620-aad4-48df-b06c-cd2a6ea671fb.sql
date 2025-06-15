
-- Add expiry_date to banners (nullable, when null means "forever")
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS expiry_date timestamp with time zone;

-- Add expiry_date to blogs (nullable, when null means "forever")
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS expiry_date timestamp with time zone;
