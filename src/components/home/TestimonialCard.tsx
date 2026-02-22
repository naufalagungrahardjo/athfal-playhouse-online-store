
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Testimonial } from '@/hooks/useTestimonials';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TEXT_LIMIT = 120;

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  const [open, setOpen] = useState(false);
  const isLong = testimonial.text.length > TEXT_LIMIT;

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));

  return (
    <>
      <div className="bg-white border border-athfal-pink/15 rounded-2xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 h-full flex flex-col w-full">
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center mb-3">
            <img
              src={testimonial.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'}
              alt={testimonial.name}
              className="w-10 h-10 rounded-full mr-3 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://randomuser.me/api/portraits/women/44.jpg';
              }}
            />
            <div>
              <h3 className="font-semibold text-athfal-pink text-sm">{testimonial.name}</h3>
              <div className="flex">{renderStars(testimonial.rating)}</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 italic flex-grow">
            "{isLong ? testimonial.text.slice(0, TEXT_LIMIT) + '...' : testimonial.text}"
          </p>
          {isLong && (
            <button
              onClick={() => setOpen(true)}
              className="self-end mt-2 text-xs text-athfal-pink font-medium hover:underline"
            >
              See more
            </button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img
                src={testimonial.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'}
                alt={testimonial.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <span className="text-athfal-pink">{testimonial.name}</span>
                <div className="flex mt-0.5">{renderStars(testimonial.rating)}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 italic mt-2">"{testimonial.text}"</p>
        </DialogContent>
      </Dialog>
    </>
  );
};
