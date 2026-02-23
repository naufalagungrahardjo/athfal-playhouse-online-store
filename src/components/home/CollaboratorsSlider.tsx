
import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useCollaborators } from '@/hooks/useCollaborators';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';

export default function CollaboratorsSlider() {
  const { collaborators, loading } = useCollaborators();
  const [emblaApi, setEmblaApi] = useState<any>(null);

  // Seamless auto-slide
  useEffect(() => {
    if (!emblaApi || !collaborators.length) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [emblaApi, collaborators.length]);

  // Fallback if empty
  if (loading) {
    return (
      <section className="py-6 bg-white">
        <div className="athfal-container">
          <div className="text-gray-500 text-sm">Loading partners...</div>
        </div>
      </section>
    );
  }

  if (!collaborators.length) {
    return (
      <section className="py-6 bg-white">
        <div className="athfal-container">
          <div className="text-gray-400 text-sm">No partners yet.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-white">
      <div className="athfal-container">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
            dragFree: false,
            slidesToScroll: 1,
            containScroll: 'trimSnaps'
          }}
          setApi={setEmblaApi}
          className="relative w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {collaborators.map((c, idx) => (
              <CarouselItem
                key={c.id ?? c.name + idx}
                className="basis-auto px-4 flex items-center justify-center"
                style={{
                  width: 220,
                  maxWidth: 240,
                }}
              >
                <img
                  src={getOptimizedImageUrl(c.logo, { width: 220, quality: 75 })}
                  alt={c.name}
                  title={c.name}
                  className="object-contain transition-all h-[35px] w-[210px] sm:h-[38px] sm:w-[220px] bg-white rounded-lg shadow border border-gray-100 hover:scale-105"
                  loading="lazy"
                  width={210}
                  height={35}
                  style={{
                    minWidth: 120,
                    minHeight: 25,
                  }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
