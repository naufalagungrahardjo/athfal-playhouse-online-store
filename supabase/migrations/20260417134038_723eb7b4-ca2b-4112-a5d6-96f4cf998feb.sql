-- Remove the default now() on active_from so new products aren't auto-scheduled into a launch window
ALTER TABLE public.products ALTER COLUMN active_from DROP DEFAULT;

-- Clear stale auto-injected active_from timestamps that were never set intentionally by an admin.
-- These rows all share the seed timestamp from a prior backfill and currently hide products from the website.
UPDATE public.products
SET active_from = NULL
WHERE active_from = '2026-04-14 07:13:52.315619+00'::timestamptz;