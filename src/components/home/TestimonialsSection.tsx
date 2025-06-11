
import { useLanguage } from '@/contexts/LanguageContext';
import { useTestimonials } from '@/hooks/useTestimonials';
import { TestimonialCard } from './TestimonialCard';

export const TestimonialsSection = () => {
  const { language } = useLanguage();
  const { loading: testimonialsLoading, getActiveTestimonials } = useTestimonials();
  
  // Get active testimonials from database
  const activeTestimonials = getActiveTestimonials();

  return (
    <section className="py-16">
      <div className="athfal-container">
        <h2 className="text-3xl font-bold text-center mb-12 text-athfal-pink">
          {language === 'id' ? 'Testimonial' : 'Testimonials'}
        </h2>

        {testimonialsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activeTestimonials.length > 0 ? (
              activeTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No testimonials available at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
