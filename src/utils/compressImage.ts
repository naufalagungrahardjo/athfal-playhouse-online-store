/**
 * Compress an image File before upload to reduce egress and storage usage.
 * Resizes to fit within maxWidth/maxHeight (preserving aspect ratio) and
 * re-encodes as JPEG (or WebP) at the given quality. Skips compression for
 * SVG/GIF (animations) and tiny files.
 */
export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
  /** Skip files already smaller than this (bytes). Default 80KB. */
  skipBelowBytes?: number;
}

export async function compressImageFile(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    mimeType = "image/jpeg",
    skipBelowBytes = 80 * 1024,
  } = opts;

  if (!file.type.startsWith("image/")) return file;
  // Don't touch SVG or animated GIFs
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  if (file.size <= skipBelowBytes) return file;

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    let { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    if (ratio >= 1 && file.size <= 400 * 1024) {
      // Already within bounds and reasonably sized; skip re-encode
      return file;
    }
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );
    if (!blob) return file;
    // If compression made it bigger somehow, keep original
    if (blob.size >= file.size) return file;

    const ext = mimeType === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.${ext}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/**
 * Generate a small WebP thumbnail (default max 400px, quality 0.7) from an
 * image File. Used for listing/grid views so visitors download a few KB
 * instead of the multi-MB original. Returns null if generation fails or the
 * source isn't a rasterizable image.
 */
export async function generateThumbnailFile(
  file: File,
  opts: { maxSize?: number; quality?: number } = {}
): Promise<File | null> {
  const { maxSize = 400, quality = 0.7 } = opts;
  if (!file.type.startsWith("image/")) return null;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return null;

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const width = Math.max(1, Math.round(img.width * ratio));
    const height = Math.max(1, Math.round(img.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob) return null;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return null;
  }
}