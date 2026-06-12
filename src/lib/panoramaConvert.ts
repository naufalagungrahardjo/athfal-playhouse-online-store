// Convert a regular panoramic photo into an equirectangular 2:1 image
// by padding top/bottom (and sides if needed) with blurred edge-stretch.
// Pure client-side via <canvas>. No upload to external service.

const TARGET_RATIO = 2; // width / height = 2:1
const MAX_WIDTH = 8192; // safety cap for canvas

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
 * Pads a cylindrical panorama to a 2:1 equirectangular canvas using
 * blurred edge-stretch fill (similar to ThingLink's pano-to-360).
 * If the input is already 2:1 or wider/narrower, it pads the shorter axis.
 */
export async function convertToEquirectangular(file: File): Promise<File> {
  // Skip non-images
  if (!file.type.startsWith('image/')) return file;

  const img = await loadImage(file);
  let srcW = img.naturalWidth;
  let srcH = img.naturalHeight;
  if (!srcW || !srcH) return file;

  // Already 2:1 (within 1% tolerance) → no conversion needed
  const ratio = srcW / srcH;
  if (Math.abs(ratio - TARGET_RATIO) / TARGET_RATIO < 0.01) return file;

  // Scale down if extremely large
  if (srcW > MAX_WIDTH) {
    const scale = MAX_WIDTH / srcW;
    srcW = Math.round(srcW * scale);
    srcH = Math.round(srcH * scale);
  }

  let outW: number;
  let outH: number;
  let drawX: number;
  let drawY: number;
  let drawW: number;
  let drawH: number;

  if (ratio > TARGET_RATIO) {
    // Too wide → pad top/bottom (most common: phone panoramas)
    outW = srcW;
    outH = Math.round(srcW / TARGET_RATIO);
    drawW = srcW;
    drawH = srcH;
    drawX = 0;
    drawY = Math.round((outH - srcH) / 2);
  } else {
    // Too tall/narrow → pad left/right
    outH = srcH;
    outW = Math.round(srcH * TARGET_RATIO);
    drawW = srcW;
    drawH = srcH;
    drawX = Math.round((outW - srcW) / 2);
    drawY = 0;
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  // --- 1. Background: stretch entire image to fill the full canvas, then blur ---
  ctx.filter = 'blur(60px)';
  ctx.drawImage(img, 0, 0, srcW, srcH, 0, 0, outW, outH);
  ctx.filter = 'none';

  // Slight dark overlay so blurred zones recede
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, outW, outH);

  // --- 2. Edge-stretch padding (sharper near the original image edges) ---
  if (drawY > 0) {
    // Stretch the top 1px row of the source upward, with a soft blur
    const topStripCanvas = document.createElement('canvas');
    topStripCanvas.width = srcW;
    topStripCanvas.height = 1;
    const tctx = topStripCanvas.getContext('2d');
    if (tctx) {
      tctx.drawImage(img, 0, 0, srcW, 1, 0, 0, srcW, 1);
      ctx.filter = 'blur(20px)';
      ctx.globalAlpha = 0.85;
      ctx.drawImage(topStripCanvas, 0, 0, srcW, 1, drawX, 0, drawW, drawY);
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
    }
    // Same for bottom
    const botStripCanvas = document.createElement('canvas');
    botStripCanvas.width = srcW;
    botStripCanvas.height = 1;
    const bctx = botStripCanvas.getContext('2d');
    if (bctx) {
      bctx.drawImage(img, 0, srcH - 1, srcW, 1, 0, 0, srcW, 1);
      ctx.filter = 'blur(20px)';
      ctx.globalAlpha = 0.85;
      ctx.drawImage(botStripCanvas, 0, 0, srcW, 1, drawX, drawY + drawH, drawW, outH - (drawY + drawH));
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
    }
  }

  // --- 3. Draw the original sharp image in the middle ---
  ctx.drawImage(img, 0, 0, srcW, srcH, drawX, drawY, drawW, drawH);

  // Export as JPEG (smaller, fine for panoramas)
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      0.9
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}-360.jpg`, { type: 'image/jpeg' });
}