

## Fix: Serve sitemap via Supabase Edge Function

Google Search Console confirms the sitemap at `athfalplayhouse.com/sitemap.xml` returns a "General HTTP error" because Lovable's hosting serves static XML files with `text/html` Content-Type. Google requires `application/xml`.

### Implementation Steps

1. **Create edge function `supabase/functions/serve-sitemap/index.ts`**
   - Returns the sitemap XML with `Content-Type: application/xml; charset=utf-8`
   - No auth required — public endpoint
   - Includes CORS headers
   - Hardcodes the same XML content from `public/sitemap.xml`

2. **Update `supabase/config.toml`**
   - Add `[functions.serve-sitemap]` with `verify_jwt = false`

3. **Update `public/robots.txt`**
   - Change `Sitemap:` directive to point to the edge function URL:
     `https://wjfsfojfeyznnddxfspx.supabase.co/functions/v1/serve-sitemap`

4. **Deploy and verify** the edge function returns correct Content-Type

### Optional Enhancement
Make the sitemap dynamic by querying the `products` and `blogs` tables to auto-include new product/blog URLs — this way you won't need to manually update the sitemap when content changes.

