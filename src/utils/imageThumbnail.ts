/**
 * Helpers to serve small thumbnails for listing/grid views.
 *
 * Uploads produce a derived WebP thumbnail stored next to the original at
 *   .../object/public/images/uploads/thumb/<name>.webp
 * Listing pages should request that thumbnail and fall back to the original
 * image if the thumbnail doesn't exist (e.g. for older uploads).
 */

/** Derive the thumbnail URL for an uploaded image, or return the original. */
export function getThumbnailUrl(url?: string | null): string {
  if (!url) return "";
  const [base] = url.split("?");
  // Only rewrite images stored under the public images/uploads/ prefix.
  const m = base.match(/^(.*\/object\/public\/images\/uploads\/)([^/]+)\.[^.]+$/);
  if (!m) return url;
  // Don't double-nest if it's already a thumb.
  if (m[2].startsWith("thumb/")) return url;
  return `${m[1]}thumb/${m[2]}.webp`;
}

/** The storage path (within the images bucket) for an upload's thumbnail. */
export function thumbnailPathForUpload(uploadPath: string): string {
  const name = uploadPath.replace(/^uploads\//, "").replace(/\.[^.]+$/, "");
  return `uploads/thumb/${name}.webp`;
}
