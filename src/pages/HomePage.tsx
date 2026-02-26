import { Suspense, lazy } from 'react';
import { HomeBanner } from '@/components/HomeBanner';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { SEOHead } from '@/components/SEOHead';
import { LazySection } from '@/components/home/LazySection';

// Lazy load below-the-fold sections to improve TTI
const AboutSection = lazy(() => import('@/components/home/AboutSection').then(m => ({ default: m.AboutSection })));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const CTASection = lazy(() => import('@/components/home/CTASection'));
const CollaboratorsSlider = lazy(() => import('@/components/home/CollaboratorsSlider'));
const BlogSlider = lazy(() => import('@/components/home/BlogSlider'));

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead url="/" />
      <HomeBanner />
      <LazySection minHeight="60px">
        <Suspense fallback={null}>
          <CollaboratorsSlider />
        </Suspense>
      </LazySection>
      <CategoriesSection />
      <FeaturedProductsSection />
      <LazySection minHeight="300px">
        <Suspense fallback={null}>
          <AboutSection />
        </Suspense>
      </LazySection>
      <LazySection minHeight="250px">
        <Suspense fallback={null}>
          <TestimonialsSection />
        </Suspense>
      </LazySection>
      <LazySection minHeight="150px">
        <Suspense fallback={null}>
          <CTASection />
        </Suspense>
      </LazySection>
      <LazySection minHeight="300px">
        <Suspense fallback={null}>
          <BlogSlider />
        </Suspense>
      </LazySection>
    </div>
  );
};

export default HomePage;
