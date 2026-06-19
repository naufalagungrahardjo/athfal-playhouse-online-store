import { lazy, Suspense, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Compass, Loader2 } from 'lucide-react';

// Heavy (pulls in three.js) — load only when a panorama is opened.
const ReactPhotoSphereViewer = lazy(() =>
  import('react-photo-sphere-viewer').then((m) => ({ default: m.ReactPhotoSphereViewer }))
);

/**
 * Compute panoData so wide / partial panoramas (e.g. phone "wide" panoramas
 * that are NOT a full 360°) are rendered with correct angular coverage instead
 * of being stretched across a full 360° loop (which causes the left/right edges
 * to be joined into a hard seam and the content to look "cut").
 *
 * A true equirectangular 360° image is 2:1. Anything significantly wider is a
 * partial panorama: we place it inside a virtual full sphere keeping pixels
 * square, so it covers only its real arc and you can pan within it.
 */
function computePanoData(width: number, height: number) {
  const ratio = width / height;
  // Close enough to 2:1 → treat as a real full equirectangular image.
  if (Math.abs(ratio - 2) < 0.05) {
    return {
      fullWidth: width,
      fullHeight: height,
      croppedWidth: width,
      croppedHeight: height,
      croppedX: 0,
      croppedY: 0,
    };
  }
  // Estimate vertical field of view for a partial panorama (~70° is typical for
  // phone wide panoramas). Horizontal coverage follows from square pixels:
  //   coverageH = ratio * coverageV
  let vFov = 70;
  let coverageH = ratio * vFov;
  // Keep horizontal coverage below ~340° so the ends never wrap into a seam.
  if (coverageH > 340) {
    coverageH = 340;
    vFov = coverageH / ratio;
  }
  const fullHeight = Math.round((height * 180) / vFov);
  const fullWidth = fullHeight * 2;
  return {
    fullWidth,
    fullHeight,
    croppedWidth: width,
    croppedHeight: height,
    croppedX: Math.round((fullWidth - width) / 2),
    croppedY: Math.round((fullHeight - height) / 2),
  };
}

interface PanoramaViewerProps {
  panoramas: string[];
  /** Accessible label for the dialog (e.g. "Lokasi Kami"). */
  label?: string;
  /** Localized hint shown beneath the thumbnails. */
  hint?: string;
}

export function PanoramaViewer({ panoramas, label = 'Panorama 360°', hint }: PanoramaViewerProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!panoramas || panoramas.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {panoramas.map((url, i) => (
          <button
            key={i}
            onClick={() => { setActiveIdx(i); setOpen(true); }}
            className="group relative aspect-video rounded-xl overflow-hidden border-2 border-athfal-peach/40 hover:border-athfal-pink transition-all"
          >
            <img src={url} alt={`Panorama ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              <div className="flex flex-col items-center gap-1 text-white">
                <Compass className="h-7 w-7" />
                <span className="text-xs font-semibold">Lihat 360°</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">{label} - Panorama 360°</DialogTitle>
          <div className="relative w-full h-full bg-black">
            {open && (
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                }
              >
                <ReactPhotoSphereViewer
                  src={panoramas[activeIdx]}
                  height="100%"
                  width="100%"
                  navbar={['zoom', 'move', 'fullscreen']}
                  defaultZoomLvl={0}
                  panoData={(image: HTMLImageElement) =>
                    computePanoData(image.width, image.height)
                  }
                />
              </Suspense>
            )}
            {panoramas.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur p-2 rounded-full z-10">
                {panoramas.map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={i === activeIdx ? 'default' : 'secondary'}
                    onClick={() => setActiveIdx(i)}
                    className="h-8 w-8 rounded-full p-0"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PanoramaViewer;