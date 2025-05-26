
import { useState, useEffect } from 'react';
import { useBanners } from '@/hooks/useBanners';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HomeBanner = () => {
  const { banners, loading } = useBanners();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Get all active banners
  const activeBanners = banners.filter(banner => banner.active);

  // Auto-rotate banners if there are multiple active banners
  useEffect(() => {
    if (activeBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
      }, 5000); // Change banner every 5 seconds

      return () => clearInterval(interval);
    }
  }, [activeBanners.length]);

  const handlePrevBanner = () => {
    setCurrentBannerIndex((prev) => 
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
  };

  const handleNextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
  };

  if (loading) {
    return (
      <div className="bg-athfal-peach/20 py-16">
        <div className="athfal-container">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 w-64 rounded mb-4"></div>
            <div className="bg-gray-200 h-4 w-96 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // If no active banners, show default banner
  if (activeBanners.length === 0) {
    return (
      <div className="bg-athfal-peach/20 py-16">
        <div className="athfal-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-athfal-pink mb-4">
                Athfal Playhouse
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                Tempat bermain dan belajar yang menyenangkan untuk anak-anak Muslim
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop"
                alt="Athfal Playhouse"
                className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentBanner = activeBanners[currentBannerIndex];

  return (
    <div className="bg-athfal-peach/20 py-16 relative">
      <div className="athfal-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-athfal-pink mb-4">
              {currentBanner.title}
            </h1>
            {currentBanner.subtitle && (
              <p className="text-lg text-gray-700 mb-6">
                {currentBanner.subtitle}
              </p>
            )}
          </div>
          <div className="relative">
            <img
              src={currentBanner.image}
              alt={currentBanner.title}
              className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop';
              }}
            />
          </div>
        </div>

        {/* Banner navigation for multiple banners */}
        {activeBanners.length > 1 && (
          <>
            {/* Navigation arrows */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handlePrevBanner}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handleNextBanner}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentBannerIndex 
                      ? 'bg-athfal-pink' 
                      : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentBannerIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
