import { HomeBanner } from '@/components/HomeBanner';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { AboutSection } from '@/components/home/AboutSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';
import CollaboratorsSlider from '@/components/home/CollaboratorsSlider';
import BlogSlider from '@/components/home/BlogSlider';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeBanner />
      <CollaboratorsSlider />
      <CategoriesSection />
      <FeaturedProductsSection />
      <AboutSection />
      <TestimonialsSection />
      <CTASection />
      <BlogSlider />
    </div>
  );
};

export default HomePage;
