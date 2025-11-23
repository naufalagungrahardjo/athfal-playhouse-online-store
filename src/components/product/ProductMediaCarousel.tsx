import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  if (!media || media.length === 0) {
    return (
      <div className="rounded-3xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center h-96">
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

  const currentMedia = media[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main media display */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg">
        {currentMedia.type === 'image' ? (
          <img
            src={currentMedia.url}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className="w-full h-auto object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop';
            }}
          />
        ) : (
          <div className="aspect-video">
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
        <div className="flex gap-2 overflow-x-auto pb-2">
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
    </div>
  );
};
