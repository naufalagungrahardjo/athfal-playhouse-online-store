import React from 'react';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';

interface AboutSectionImageProps {
  heroImage: string;
  aboutDecorativeImage?: string;
}

export const AboutSectionImage: React.FC<AboutSectionImageProps> = ({
  heroImage,
  aboutDecorativeImage
}) => (
  <div className="relative">
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
    <div className="absolute -bottom-6 -left-6 bg-athfal-yellow rounded-full p-4 shadow-lg animate-bounce-slow">
      <img
        src={aboutDecorativeImage || "/lovable-uploads/banner_1.png"}
        alt="Decorative element"
        className="w-16 h-16"
      />
    </div>
  </div>
);
