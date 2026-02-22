
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTestimonials } from '@/hooks/useTestimonials';
import { TestimonialCard } from './TestimonialCard';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

export const TestimonialsSection = () => {
  const { language } = useLanguage();
  const { loading: testimonialsLoading, getActiveTestimonials } = useTestimonials();
  const [emblaApi, setEmblaApi] = useState<any>(null);

  const activeTestimonials = getActiveTestimonials();

  // Auto-slide
  useEffect(() => {
    if (!emblaApi || activeTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi, activeTestimonials.length]);

  return (
    <section className="py-8 bg-gradient-to-br from-athfal-peach/10 to-white">
      <div className="athfal-container">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-athfal-pink">
          {language === 'id' ? 'Testimonial' : 'Testimonials'}
        </h2>

        {testimonialsLoading ? (
          <div className="flex gap-4 justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 w-[340px] rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : activeTestimonials.length > 0 ? (
          <Carousel
            opts={{
              align: 'start',
              loop: true,
              dragFree: false,
              slidesToScroll: 1,
              containScroll: 'trimSnaps',
            }}
            setApi={setEmblaApi}
            className="relative w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {activeTestimonials.map((testimonial) => (
                <CarouselItem
                  key={testimonial.id}
                  className="basis-auto px-2 sm:px-4 flex items-center justify-center"
                  style={{ width: 340, maxWidth: 360 }}
                >
                  <TestimonialCard testimonial={testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No testimonials available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};
