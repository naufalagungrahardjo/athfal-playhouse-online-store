
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type ManagementMember = {
  name: string;
  title: string;
  image: string;
  linkedin: string;
};

interface ManagementSliderProps {
  members: ManagementMember[];
}

export const ManagementSlider = ({ members }: ManagementSliderProps) => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const numVisible = 4;

  // Auto play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, 3000);
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [currentIndex, isAutoPlaying, members.length]);
  
  // Next slide
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === members.length - numVisible ? 0 : prevIndex + 1
    );
  };
  
  // Previous slide
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? members.length - numVisible : prevIndex - 1
    );
  };

  // Pause auto-play on mouse enter, resume on leave
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);
  
  return (
    <div 
      className="relative w-full mt-8" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation buttons */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10">
        <Button
          onClick={prevSlide}
          variant="outline"
          size="icon"
          className="rounded-full bg-white/80 hover:bg-white border-none shadow-md h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10">
        <Button
          onClick={nextSlide}
          variant="outline"
          size="icon"
          className="rounded-full bg-white/80 hover:bg-white border-none shadow-md h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Slider content */}
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / numVisible)}%)` }}
        >
          {members.map((member, index) => (
            <div 
              key={index}
              className="w-1/4 flex-shrink-0 px-3"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-athfal-pink">
                    {member.name}
                  </h3>
                  <p className="text-gray-600 mb-2">{member.title}</p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-athfal-green hover:text-athfal-green/80 text-sm"
                  >
                    <span>{language === "id" ? "Lihat Profile" : "View Profile"}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots navigation */}
      <div className="flex justify-center mt-4">
        {[...Array(Math.ceil((members.length - numVisible + 1) / 1))].map((_, index) => (
          <button 
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 w-2 rounded-full mx-1 ${
              index === currentIndex ? 'bg-athfal-pink' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
