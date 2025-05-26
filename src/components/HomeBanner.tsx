
import { useBanners } from '@/hooks/useBanners';

export const HomeBanner = () => {
  const { banners, loading } = useBanners();

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

  // Get the active banner
  const activeBanner = banners.find(banner => banner.active);

  if (!activeBanner) {
    // Default banner if no active banner is set
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

  return (
    <div className="bg-athfal-peach/20 py-16">
      <div className="athfal-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-athfal-pink mb-4">
              {activeBanner.title}
            </h1>
            {activeBanner.subtitle && (
              <p className="text-lg text-gray-700 mb-6">
                {activeBanner.subtitle}
              </p>
            )}
          </div>
          <div className="relative">
            <img
              src={activeBanner.image}
              alt={activeBanner.title}
              className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=400&fit=crop';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
