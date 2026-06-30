# Reduce Egress (Cached Egress) — Findings & Plan

## What I found (the real numbers)
I inspected your storage and code. Egress = data shipped out to visitors. "Cached egress" = the same files being shipped over and over from the CDN. Two concrete problems are driving it:

1. **Your images expire from cache after just 1 hour.** Every uploaded image is saved with `Cache-Control: max-age=3600` (1 hour). After an hour, every visitor's browser and the CDN throw the image away and download it again — even though the image never changes. This is the single biggest cause of *repeated/cached* egress.
2. **Images are big and served at full size everywhere.** The `images` bucket holds **603 files = 343 MB**, averaging **583 KB each**, with many **3–4.7 MB** originals. Your "optimizer" is currently a no-op, so the same huge file is sent for tiny product thumbnails, listing grids, and full-screen views alike.

Smaller, secondary contributors: ~12 live "real-time" subscriptions that re-pull whole tables on any change (database egress), and a `?t=timestamp` tag added to image URLs that slightly weakens caching.

## Where the highest egress comes from
- **Public pages everyone visits** (home, product listing, product detail, gallery, blog) loading full-size images → multiplied by the 1-hour cache expiry = the bulk of egress.
- **Largest single files:** product/upload photos and 360° panoramas (3–4.7 MB each).
- **Admin/data refreshes** from real-time subscriptions (smaller, but constant).

## The plan (ordered by impact vs. effort)

### Phase 1 — Cache images for a year (biggest win, lowest effort)
Image filenames are already unique timestamps, so an image at a given URL never changes — it's safe to cache "forever."
- Change all upload code to save `Cache-Control: max-age=31536000, immutable` (1 year) instead of `3600`.
- Run a **one-time backfill script** that re-applies the 1-year cache header to the 603 existing files.
- Remove the `?t=timestamp` cache-buster appended to new image URLs (it's unnecessary since filenames are already unique).

Result: returning visitors and the CDN stop re-downloading unchanged images — this directly collapses *cached* egress.

### Phase 2 — Make images smaller (high win)
- **Generate a small thumbnail on upload** (e.g. 400px WebP) and store it next to the original. Use the thumbnail on listing grids, cards, related-products, and gallery previews; load the full image only on the detail/lightbox view. This makes the no-op optimizer actually do its job.
- **Compress on every upload path.** Compression already runs in product/document/check-in uploads; extend the same WebP compression (quality ~0.8, max 1600px) to any upload path still missing it. (360° panoramas stay full-size by design.)
- **Optional one-time cleanup:** re-compress existing oversized originals (the 3–4.7 MB files) down to ~web size. This shrinks both storage and egress but rewrites stored images, so I'd do it carefully and only with your go-ahead.

### Phase 3 — Trim repeated data fetches (smaller win)
- Narrow the real-time subscriptions so they don't re-pull entire tables on every change (use the change payload or fetch only what's needed), and drop subscriptions on pages that don't need live updates.
- Replace the broken-image fallback that points to an external Unsplash photo with a local placeholder (avoids wasted external fetches).

## What you'll be able to see / control
Nothing visually changes for your visitors — images look the same, just load faster and re-download far less. After Phase 1+2, repeated/cached egress should drop substantially because the same images are no longer re-shipped hourly and listing pages send small thumbnails instead of multi-MB originals.

---

## Technical section (for reference)
- **Cache header:** set `cacheControl: '31536000'` (+ rely on immutable) in `FileUploadInput.tsx`, `PanoramaUploadInput.tsx`, `AdminDocuments.tsx`, `AdminCheckInOut.tsx`, `OrderDetailsDialog.tsx`, and any other `.upload(...)` calls. Backfill existing objects via a service-role Node script using the Storage API (`copy`/re-upload with the new `cacheControl`) — not by editing the reserved `storage` schema directly.
- **Buckets:** `images` is public (good for CDN). Current headers confirmed as `max-age=3600` on stored objects.
- **Thumbnails:** on upload, produce a derived WebP (~400px) via the existing `compressImageFile` (`mimeType: 'image/webp'`), store as `uploads/thumb/<name>.webp`; update `getOptimizedImageUrl`/`ProductCard`/home + gallery cards to use it, falling back to the original if no thumb exists.
- **Cache-buster:** remove `?t=${Date.now()}` from the returned URL in `FileUploadInput.tsx`.
- **Realtime:** in hooks under `src/hooks/*` and `CartContext`, scope channels and avoid full `fetchData()` refetch on every `postgres_changes` event where a payload-based update suffices.
- **No DB schema changes required** for Phases 1 and 3; Phase 2 thumbnails are additive files only.
