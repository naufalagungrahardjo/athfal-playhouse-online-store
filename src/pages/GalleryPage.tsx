
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGalleryContent } from "@/hooks/useGalleryContent";
import { getVideoSource } from "@/components/admin/VideoUrlInput";

const GalleryPage = () => {
  const { language } = useLanguage();
  const { content } = useGalleryContent();

  const videoItems = content.items.filter(item => item.type === 'video');
  const imageItems = content.items.filter(item => item.type === 'image');

  const renderVideoEmbed = (url: string, title: string) => {
    const source = getVideoSource(url);

    if (source === 'instagram') {
      return (
        <div className="relative w-full" style={{ paddingBottom: "125%" }}>
          <iframe
            src={url}
            title={title}
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-xl border-0"
          />
        </div>
      );
    }

    // YouTube or other (default 16:9)
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={url}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-xl"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-8">
          {language === "id" ? content.heroTitle.id : content.heroTitle.en}
        </h1>
        
        <div className="mb-8">
          <p className="text-gray-700">
            {language === "id" ? content.heroSubtitle.id : content.heroSubtitle.en}
          </p>
        </div>

        {/* Hero Image */}
        <div className="mb-12 rounded-3xl overflow-hidden">
          <img
            src={content.heroImage}
            alt="Gallery"
            className="w-full h-64 object-cover"
          />
        </div>
        
        {/* Video section */}
        {videoItems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-athfal-green mb-4">
              {language === "id" ? "Video Terbaru" : "Latest Videos"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videoItems.map((video) => (
                <div key={video.id} className="space-y-2">
                  {renderVideoEmbed(video.url, video.title)}
                  <h3 className="font-semibold text-athfal-pink">{video.title}</h3>
                  <p className="text-sm text-gray-600">{video.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Photo gallery */}
        {imageItems.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-athfal-green mb-4">
              {language === "id" ? "Foto Kegiatan" : "Activity Photos"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {imageItems.map((image) => (
                <div 
                  key={image.id} 
                  className="group cursor-pointer"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-200 hover:scale-[1.02] transition-all">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2">
                    <h3 className="font-medium text-athfal-pink">{image.title}</h3>
                    <p className="text-sm text-gray-600">{image.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {language === "id" ? "Belum ada konten galeri." : "No gallery content yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
