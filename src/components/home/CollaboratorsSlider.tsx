
import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

const collaborators = [
  { name: 'Techify Inc.', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg' },
  { name: 'EduWorld', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Icon-Vue.png' },
  { name: 'Coders LTD', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg' },
  { name: 'Jane Studios', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Solidity.svg' },
  { name: 'NextLeap', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Nextjs-logo.svg' },
  { name: 'DesignLab', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg' },
];

export default function CollaboratorsSlider() {
  const [emblaApi, setEmblaApi] = useState<any>(null);

  useEffect(() => {
    if (!emblaApi) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="py-6 bg-white">
      <div className="athfal-container">
        <Carousel
          opts={{
            align: 'start',
            loop: true,             // Enable infinite looping
            dragFree: false,        // Snap cleanly to each slide
            slidesToScroll: 1,      // Only slide one item per movement
            containScroll: 'trimSnaps',
            draggable: false        // Disable dragging for a perfect seamless auto-slider
          }}
          setApi={setEmblaApi}
          className="relative w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {collaborators.map((c, idx) => (
              <CarouselItem
                key={c.name + idx}
                className="basis-auto px-4 flex items-center justify-center"
                style={{
                  width: 220,
                  maxWidth: 240,
                }}
              >
                <img
                  src={c.logo}
                  alt={c.name}
                  title={c.name}
                  className="object-contain transition-all h-[35px] w-[210px] sm:h-[38px] sm:w-[220px] bg-white rounded-lg shadow border border-gray-100 hover:scale-105"
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
