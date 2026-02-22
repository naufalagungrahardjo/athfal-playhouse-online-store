import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export interface ProductMedia {
  url: string;
  type: 'image' | 'video';
}

interface ProductMediaCarouselProps {
  media: ProductMedia[];
  productName: string;
}

export const ProductMediaCarousel = ({ media, productName }: ProductMediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="rounded-3xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center" style={{ width: 450, height: 450 }}>
        <p className="text-gray-400">No media available</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxPrev = () => {
    const images = media.filter(m => m.type === 'image');
    setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const lightboxNext = () => {
    const images = media.filter(m => m.type === 'image');
    setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = media[currentIndex];
  const imageMedia = media.filter(m => m.type === 'image');

  return (
    <div className="space-y-4">
      {/* Main media display - fixed 450x450 */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg mx-auto" style={{ width: 450, height: 450, maxWidth: '100%' }}>
        {currentMedia.type === 'image' ? (
          <img
            src={currentMedia.url}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            style={{ width: 450, height: 450 }}
            onClick={() => {
              const imgIdx = imageMedia.findIndex(m => m.url === currentMedia.url);
              openLightbox(imgIdx >= 0 ? imgIdx : 0);
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop';
            }}
          />
        ) : (
          <div className="w-full h-full">
            <iframe
              src={currentMedia.url}
              title={`${productName} - Video ${currentIndex + 1}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        {/* Navigation arrows */}
        {media.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
          {media.map((item, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-athfal-pink' : 'border-gray-200'
              }`}
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
                  Video
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[900px] p-4 bg-black/95 border-none">
          <div className="relative flex items-center justify-center">
            {imageMedia.length > 0 && (
              <img
                src={imageMedia[lightboxIndex]?.url}
                alt={`${productName} - Full size`}
                className="object-contain rounded-lg"
                style={{ width: 800, height: 800, maxWidth: '100%', maxHeight: '80vh' }}
              />
            )}

            {imageMedia.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={lightboxPrev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={lightboxNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
          {imageMedia.length > 1 && (
            <p className="text-center text-white/60 text-sm mt-2">
              {lightboxIndex + 1} / {imageMedia.length}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
