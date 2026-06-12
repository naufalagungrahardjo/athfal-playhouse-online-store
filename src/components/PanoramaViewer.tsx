import { useState } from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

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
              <ReactPhotoSphereViewer
                src={panoramas[activeIdx]}
                height="100%"
                width="100%"
                navbar={['zoom', 'move', 'fullscreen']}
                defaultZoomLvl={0}
              />
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