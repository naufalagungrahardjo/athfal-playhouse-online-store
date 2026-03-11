import React from 'react';
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
  const hasHeroImage = heroImage && !heroImage.includes('unsplash.com/photo-1635107510862');
  const hasVideo = !!aboutVideoUrl;

  if (!hasHeroImage && !hasVideo) return null;

  return (
    <div className="relative space-y-6">
      {hasHeroImage && (
        <div className="rounded-3xl overflow-hidden shadow-xl">
          <img
            src={getOptimizedImageUrl(heroImage, { width: 665, quality: 80 })}
            alt="Children playing"
            className="w-full h-auto object-cover"
            loading="lazy"
            width={665}
            height={223}
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
      <div className="absolute -bottom-6 -left-6 bg-athfal-yellow rounded-full p-4 shadow-lg animate-bounce-slow">
        <img
          src={aboutDecorativeImage || "/lovable-uploads/banner_1.png"}
          alt="Decorative element"
          className="w-16 h-16"
        />
      </div>
    </div>
  );
};
