
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useBlogs } from '@/hooks/useBlogs';
import { Calendar, User } from 'lucide-react';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';

export default function BlogSlider() {
  const { blogs, loading } = useBlogs();
  const [emblaApi, setEmblaApi] = useState<any>(null);

  // Get 10 newest published blogs
  const sortedBlogs = blogs
    .filter(blog => blog.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Auto-slide interval
  useEffect(() => {
    if (!emblaApi || sortedBlogs.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [emblaApi, sortedBlogs.length]);

  // Date formatter helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="athfal-container text-center text-gray-400">Loading blog reviews...</div>
      </section>
    );
  }

  if (!sortedBlogs.length) {
    return (
      <section className="py-8 bg-white">
        <div className="athfal-container text-center text-gray-400">No blogs yet.</div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gradient-to-br from-athfal-peach/10 to-white">
      <div className="athfal-container">
        <h2 className="text-2xl md:text-3xl font-bold text-athfal-pink mb-6 text-center">
          Latest Blog Reviews
        </h2>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
            dragFree: false,
            slidesToScroll: 1,
            containScroll: 'trimSnaps'
          }}
          setApi={setEmblaApi}
          className="relative w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {sortedBlogs.map((blog, idx) => (
              <CarouselItem
                key={blog.id}
                className="basis-auto px-2 sm:px-4 flex items-center justify-center"
                style={{ width: 340, maxWidth: 360 }}
              >
                <Link to={`/blog/${blog.id}`} className="block w-full h-full group">
                  <div className="bg-white border border-athfal-pink/15 rounded-2xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 h-full flex flex-col">
                    <div className="w-full aspect-video rounded-t-2xl overflow-hidden">
                      <img
                        src={getOptimizedImageUrl(blog.image, { width: 340, quality: 75 })}
                        alt={blog.title}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        loading="lazy"
                        width={340}
                        height={191}
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-athfal-pink text-lg line-clamp-2 mb-1">
                        {blog.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 gap-3 mb-2">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(blog.date)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {blog.author}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{blog.content.replace(/<[^>]+>/g, '').slice(0, 80)}...</p>
                      <span className="inline-block bg-athfal-teal/10 text-athfal-teal rounded px-2 py-0.5 text-xs mt-auto">
                        {blog.category}
                      </span>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
