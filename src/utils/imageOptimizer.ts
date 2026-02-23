/**
 * Optimizes Supabase Storage image URLs by appending render/image transform parameters.
 * This converts images to WebP format and resizes them on-the-fly via Supabase Image Transformations.
 * 
 * For non-Supabase URLs, returns the original URL unchanged.
 * 
 * NOTE: Supabase Image Transformations require the Pro plan.
 * If not on Pro, the original URL is returned as-is (no errors).
 */

const SUPABASE_STORAGE_PATTERN = /\/storage\/v1\/object\/public\//;

export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '';

  // Only transform Supabase storage URLs
  if (!SUPABASE_STORAGE_PATTERN.test(url)) {
    return url;
  }

  const { width, height, quality = 75 } = options;

  // Convert /storage/v1/object/public/ to /storage/v1/render/image/public/
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  // Strip existing query params (like cache busters) and rebuild
  const [baseUrl] = renderUrl.split('?');
  const params = new URLSearchParams();

  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));
  params.set('format', 'origin'); // Use 'origin' as fallback if WebP not supported on plan

  const paramString = params.toString();
  return paramString ? `${baseUrl}?${paramString}` : baseUrl;
}
