
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Testimonial } from '@/hooks/useTestimonials';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <Card className="athfal-card h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center mb-4">
          <img
            src={testimonial.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full mr-4 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://randomuser.me/api/portraits/women/44.jpg';
            }}
          />
          <div>
            <h3 className="font-semibold text-athfal-pink">{testimonial.name}</h3>
            <div className="flex">
              {renderStars(testimonial.rating)}
            </div>
          </div>
        </div>
        <p className="text-gray-700 italic flex-grow">"{testimonial.text}"</p>
      </CardContent>
    </Card>
  );
};
