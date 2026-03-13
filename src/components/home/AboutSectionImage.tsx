import React, { useState } from 'react';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { convertToEmbedUrl } from '@/components/admin/VideoUrlInput';

interface AboutSectionImageProps {
  heroImage: string;
  aboutDecorativeImage?: string;
  aboutVideoUrl?: string;
}

export const AboutSectionImage: React.FC<AboutSectionImageProps> = ({
  heroImage,
  aboutDecorativeImage,
  aboutVideoUrl
}) => {
  const [imageError, setImageError] = useState(false);
  const hasHeroImage = heroImage && !heroImage.includes('unsplash.com/photo-1635107510862') && !imageError;
  const hasVideo = !!aboutVideoUrl;

  if (!hasHeroImage && !hasVideo) return null;

  return (
    <div className="relative space-y-6 pb-8">
      {hasHeroImage && (
        <div className="rounded-3xl overflow-hidden shadow-xl">
          <img
            src={getOptimizedImageUrl(heroImage, { width: 665, quality: 80 })}
            alt="About Athfal Playhouse"
            className="w-full h-auto object-cover min-h-[180px]"
            loading="lazy"
            width={665}
            height={400}
            onError={() => setImageError(true)}
          />
        </div>
      )}
      {hasVideo && (
        <div className="rounded-3xl overflow-hidden shadow-xl">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={convertToEmbedUrl(aboutVideoUrl)}
              title="About Athfal Playhouse"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}
      <div className="absolute -bottom-4 -left-4 bg-athfal-yellow rounded-full p-4 shadow-lg animate-bounce-slow z-10">
        <img
          src={aboutDecorativeImage || "/lovable-uploads/4e490da3-e092-4eec-b20b-d66ed04832e7.png"}
          alt="Decorative element"
          className="w-16 h-16"
        />
      </div>
    </div>
  );
};
