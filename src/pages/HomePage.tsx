
import { HomeBanner } from '@/components/HomeBanner';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { AboutSection } from '@/components/home/AboutSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeBanner />
      <CategoriesSection />
      <FeaturedProductsSection />
      <AboutSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default HomePage;
