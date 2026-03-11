import { useState, useCallback, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';
import { CategoryCard } from './CategoryCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

export const CategoriesSection = () => {
  const { language } = useLanguage();
  const { categories, loading } = useCategories();
  const [activeIndex, setActiveIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: true,
    slidesToScroll: 1,
    containScroll: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="py-12 md:py-16 bg-athfal-peach/10">
      <div className="athfal-container">
        <div className="flex flex-row gap-4 md:gap-8 lg:gap-12 items-center">
          {/* Left side - descriptive text */}
          <div className="w-2/5 flex flex-col justify-center shrink-0">
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-athfal-pink leading-tight mb-2 md:mb-4">
              {language === 'id' ? 'Program Kami' : 'Our Programs'}
            </h2>
            <p className="text-xs sm:text-sm md:text-lg text-muted-foreground leading-relaxed mb-3 md:mb-6 hidden sm:block">
              {language === 'id'
                ? 'Berbagai kelas dan aktivitas untuk menumbuhkan kecintaan dan pemahaman tentang Allah, Rasulullah, Quran dan Islam.'
                : 'Various classes and activities to nurture the love and understanding about Allah, Rasulullah, Quran and Islam.'}
            </p>
            <a
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-athfal-yellow text-foreground font-semibold px-4 md:px-6 py-2 md:py-3 hover:opacity-90 transition-opacity w-fit text-xs md:text-base"
            >
              {language === 'id' ? 'Lihat Semua' : 'View All'}
            </a>
          </div>

          {/* Right side - carousel with focus effect */}
          <div className="w-3/5 relative">
            {/* Navigation arrows */}
            <button
              onClick={scrollPrev}
              className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full border border-athfal-pink/30 bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-athfal-pink" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full border border-athfal-pink/30 bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-athfal-pink" />
            </button>

            {loading ? (
              <div className="flex gap-4 justify-center">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse shrink-0 w-32 h-40 md:w-48 md:h-56 bg-muted rounded-2xl" />
                ))}
              </div>
            ) : (
              <div ref={emblaRef} className="overflow-hidden">
                <div className="flex">
                  {categories.map((category, index) => (
                    <div
                      key={category.id}
                      className="flex-[0_0_65%] sm:flex-[0_0_50%] md:flex-[0_0_45%] min-w-0 px-2 transition-all duration-300"
                      style={{
                        transform: index === activeIndex ? 'scale(1)' : 'scale(0.85)',
                        opacity: index === activeIndex ? 1 : 0.5,
                        filter: index === activeIndex ? 'none' : 'grayscale(40%)',
                        zIndex: index === activeIndex ? 10 : 1,
                      }}
                    >
                      <CategoryCard
                        title={category.title}
                        href={`/products/${category.slug}`}
                        image={category.image}
                        bgColor={category.bg_color}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dots */}
            {categories.length > 0 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {categories.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === activeIndex ? 'bg-athfal-pink w-4' : 'bg-muted-foreground/30'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
