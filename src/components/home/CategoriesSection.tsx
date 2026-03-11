import { useRef, useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebsiteCopy } from '@/hooks/useWebsiteCopy';
import { CategoryCard } from './CategoryCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CategoriesSection = () => {
  const { language } = useLanguage();
  const { categories, loading } = useCategories();
  const { copy } = useWebsiteCopy();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);

    // Calculate active dot
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 16
      : 200;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(idx);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 16
      : 200;
    el.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  };

  const heroTitle = language === 'id'
    ? copy.homePage.heroTitle.id
    : copy.homePage.heroTitle.en;

  return (
    <section className="py-12 md:py-16 bg-athfal-peach/10">
      <div className="athfal-container">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Left side - descriptive text */}
          <div className="w-full lg:w-2/5 flex flex-col justify-center shrink-0">
            <h2 className="text-3xl md:text-4xl font-bold text-athfal-pink leading-tight mb-4">
              {language === 'id' ? 'Program Kami' : 'Our Programs'}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
              {language === 'id'
                ? 'Berbagai kelas dan aktivitas untuk menumbuhkan kecintaan dan pemahaman tentang Allah, Rasulullah, Quran dan Islam.'
                : 'Various classes and activities to nurture the love and understanding about Allah, Rasulullah, Quran and Islam.'}
            </p>
            <a
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-athfal-yellow text-foreground font-semibold px-6 py-3 hover:opacity-90 transition-opacity w-fit text-sm md:text-base"
            >
              {language === 'id' ? 'Lihat Semua' : 'View All'}
            </a>
          </div>

          {/* Right side - slideable cards */}
          <div className="w-full lg:w-3/5 relative">
            {/* Navigation arrows */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-border bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-border bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}

            {/* Scrollable cards */}
            {loading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse shrink-0 w-44 h-52 bg-muted rounded-2xl" />
                ))}
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    title={category.title}
                    href={`/products/${category.slug}`}
                    image={category.image}
                    bgColor={category.bg_color}
                  />
                ))}
              </div>
            )}

            {/* Dots */}
            {categories.length > 0 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {categories.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === activeIndex ? 'bg-athfal-pink' : 'bg-muted-foreground/30'
                    }`}
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
