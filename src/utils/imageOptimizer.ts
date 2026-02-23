/**
 * Returns the original image URL unchanged.
 * 
 * Supabase Image Transformations (render/image) require Pro plan.
 * This utility is a no-op placeholder that preserves all existing URLs.
 * 
 * When you upgrade to Supabase Pro, you can enable transforms by
 * uncommenting the render/image URL rewrite logic below.
 */

export function getOptimizedImageUrl(
  url: string | undefined | null,
  _options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '';
  // Return original URL as-is to preserve all uploaded images
  return url;
}
