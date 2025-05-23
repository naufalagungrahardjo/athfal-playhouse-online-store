
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const GalleryPage = () => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-8">
          {language === "id" ? "Galeri" : "Gallery"}
        </h1>
        
        {/* Embedded video section with improved aspect ratio */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-athfal-green mb-4">
            {language === "id" ? "Video Terbaru" : "Latest Video"}
          </h2>
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}> {/* 16:9 aspect ratio */}
            <iframe 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              title="Athfal Playhouse Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full rounded-xl"
              width="560" 
              height="315"
            ></iframe>
          </div>
        </div>
        
        {/* Photo gallery */}
        <div>
          <h2 className="text-2xl font-semibold text-athfal-green mb-4">
            {language === "id" ? "Foto Kegiatan" : "Activity Photos"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div 
                key={item} 
                className="aspect-square rounded-xl overflow-hidden bg-gray-200 hover:scale-[1.02] transition-all"
              >
                <img
                  src={`https://picsum.photos/500/500?random=${item}`}
                  alt={`Gallery image ${item}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
