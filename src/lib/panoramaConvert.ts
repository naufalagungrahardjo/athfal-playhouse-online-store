// Convert a regular panoramic photo into an equirectangular 2:1 image
// by padding top/bottom (or sides) with a blurred edge-stretch — matching
// ThingLink's pano-to-360 output. Pure client-side via <canvas>.

const TARGET_RATIO = 2; // width / height = 2:1
// Mobile browsers (especially iOS Safari / Android Chrome) silently fail to
// render canvases wider/taller than ~4096px — toBlob then returns a blank or
// broken image. 4096x2048 is the standard, reliable equirectangular size and
// is sharp enough for web 360° viewers.
const MAX_WIDTH = 4096;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resolution-independent blur: draw the given edge strip of the source heavily
 * downscaled onto a tiny canvas, then scale it back up into the pad area with
 * smoothing enabled. This produces a soft ThingLink-style gradient on EVERY
 * browser (no reliance on ctx.filter = 'blur()', which is flaky on mobile).
 */
function drawBlurredStrip(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  // source rect (the thin edge strip to sample)
  sx: number, sy: number, sw: number, sh: number,
  // destination rect (the pad zone to fill)
  dx: number, dy: number, dw: number, dh: number,
) {
  if (dw <= 0 || dh <= 0) return;
  const tmp = document.createElement('canvas');
  // Tiny intermediate buffer — the heavy downscale is what creates the blur.
  tmp.width = 64;
  tmp.height = 8;
  const tctx = tmp.getContext('2d');
  if (!tctx) return;
  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = 'high';
  tctx.drawImage(img, sx, sy, sw, sh, 0, 0, tmp.width, tmp.height);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, dx, dy, dw, dh);
  ctx.restore();
}

/** Average colour of an edge band, used as a neutral backdrop fill. */
function edgeAverageColor(
  img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number,
): string {
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    const cx = c.getContext('2d', { willReadFrequently: true });
    if (!cx) return '#969696';
    cx.drawImage(img, sx, sy, sw, sh, 0, 0, 1, 1);
    const [r, g, b] = cx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return '#969696';
  }
}

/**
 * Pads a panorama to 2:1 equirectangular using edge-stretch blur fill.
 * The original image is preserved at its native pixel size in the centre —
 * only the empty pad areas are filled with a softened stretch of the
 * top/bottom (or side) edge rows. This matches ThingLink's output.
 */
export async function convertToEquirectangular(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const img = await loadImage(file);
  let srcW = img.naturalWidth;
  let srcH = img.naturalHeight;
  if (!srcW || !srcH) return file;

  const ratio = srcW / srcH;
  // Already 2:1 within 1% → skip
  if (Math.abs(ratio - TARGET_RATIO) / TARGET_RATIO < 0.01) return file;

  // Scale down monster files
  if (srcW > MAX_WIDTH) {
    const scale = MAX_WIDTH / srcW;
    srcW = Math.round(srcW * scale);
    srcH = Math.round(srcH * scale);
  }

  let outW: number, outH: number, drawX: number, drawY: number;

  if (ratio > TARGET_RATIO) {
    // Too wide → pad top/bottom (typical phone panorama)
    outW = srcW;
    outH = Math.round(srcW / TARGET_RATIO);
    drawX = 0;
    drawY = Math.round((outH - srcH) / 2);
  } else {
    // Too tall/narrow → pad left/right
    outH = srcH;
    outW = Math.round(srcH * TARGET_RATIO);
    drawX = Math.round((outW - srcW) / 2);
    drawY = 0;
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  // Neutral dark backdrop in case of any uncovered pixels
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, outW, outH);

  // --- Edge-stretch padding only (no full-image blur background) ---
  // Use a small strip from the edge of the source, stretch it across the
  // pad zone, then heavy-blur so only smooth colour remains.
  const STRIP = 8; // pixels of source edge to sample

  if (ratio > TARGET_RATIO && drawY > 0) {
    // TOP pad: stretch top STRIP rows of source upward
    ctx.save();
    ctx.filter = 'blur(40px)';
    ctx.drawImage(img, 0, 0, img.naturalWidth, STRIP, 0, -20, outW, drawY + 20);
    ctx.restore();

    // BOTTOM pad: stretch bottom STRIP rows downward
    ctx.save();
    ctx.filter = 'blur(40px)';
    const bottomY = drawY + srcH;
    ctx.drawImage(
      img,
      0, img.naturalHeight - STRIP, img.naturalWidth, STRIP,
      0, bottomY - 20, outW, (outH - bottomY) + 20
    );
    ctx.restore();
  } else if (ratio < TARGET_RATIO && drawX > 0) {
    // LEFT pad
    ctx.save();
    ctx.filter = 'blur(40px)';
    ctx.drawImage(img, 0, 0, STRIP, img.naturalHeight, -20, 0, drawX + 20, outH);
    ctx.restore();
    // RIGHT pad
    ctx.save();
    ctx.filter = 'blur(40px)';
    const rightX = drawX + srcW;
    ctx.drawImage(
      img,
      img.naturalWidth - STRIP, 0, STRIP, img.naturalHeight,
      rightX - 20, 0, (outW - rightX) + 20, outH
    );
    ctx.restore();
  }

  // --- Draw original sharp image centred ---
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, srcW, srcH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      0.92
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}-360.jpg`, { type: 'image/jpeg' });
}