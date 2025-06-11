
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCategory } from '@/contexts/CartContext';
import { HomeBanner } from '@/components/HomeBanner';
import { useProducts } from '@/hooks/useProducts';
import { useTestimonials } from '@/hooks/useTestimonials';
import { Star } from 'lucide-react';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const HomePage = () => {
  const { t, language } = useLanguage();
  const { products, loading } = useProducts();
  const { testimonials, loading: testimonialsLoading, getActiveTestimonials } = useTestimonials();
  
  // Get featured products (first 4 products from database)
  const featuredProducts = products.slice(0, 4);
  
  // Get active testimonials from database
  const activeTestimonials = getActiveTestimonials();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner */}
      <HomeBanner />

      {/* Categories Section */}
      <section className="py-16 bg-athfal-peach/10">
        <div className="athfal-container">
          <h2 className="text-3xl font-bold text-center mb-12 text-athfal-pink">
            {language === 'id' ? 'Kategori Produk Kami' : 'Our Product Categories'}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Pop Up Class */}
            <Link to="/products/pop-up-class" className="group">
              <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
                <div className="bg-athfal-yellow/20 rounded-full p-4 mb-4 group-hover:scale-105 transition-transform">
                  <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=100&h=100&fit=crop&auto=format" alt="Pop Up Class" className="w-10 h-10 object-cover rounded-full" />
                </div>
                <h3 className="font-semibold text-athfal-pink">Pop Up Class</h3>
              </div>
            </Link>

            {/* Bumi Class */}
            <Link to="/products/bumi-class" className="group">
              <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
                <div className="bg-athfal-green/20 rounded-full p-4 mb-4 group-hover:scale-105 transition-transform">
                  <img src="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=100&h=100&fit=crop&auto=format" alt="Bumi Class" className="w-10 h-10 object-cover rounded-full" />
                </div>
                <h3 className="font-semibold text-athfal-pink">Bumi Class</h3>
              </div>
            </Link>

            {/* Tahsin Class */}
            <Link to="/products/tahsin-class" className="group">
              <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
                <div className="bg-athfal-pink/20 rounded-full p-4 mb-4 group-hover:scale-105 transition-transform">
                  <img src="https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=100&h=100&fit=crop&auto=format" alt="Tahsin Class" className="w-10 h-10 object-cover rounded-full" />
                </div>
                <h3 className="font-semibold text-athfal-pink">Tahsin Class</h3>
              </div>
            </Link>

            {/* Play Kit */}
            <Link to="/products/play-kit" className="group">
              <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
                <div className="bg-athfal-teal/20 rounded-full p-4 mb-4 group-hover:scale-105 transition-transform">
                  <img src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=100&h=100&fit=crop&auto=format" alt="Play Kit" className="w-10 h-10 object-cover rounded-full" />
                </div>
                <h3 className="font-semibold text-athfal-pink">Play Kit</h3>
              </div>
            </Link>

            {/* Consultation */}
            <Link to="/products/consultation" className="group">
              <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
                <div className="bg-athfal-light-pink/30 rounded-full p-4 mb-4 group-hover:scale-105 transition-transform">
                  <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop&auto=format" alt="Psychological Consultation" className="w-10 h-10 object-cover rounded-full" />
                </div>
                <h3 className="font-semibold text-athfal-pink">Konsultasi</h3>
              </div>
            </Link>

            {/* Merchandise */}
            <Link to="/products/merchandise" className="group">
              <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
                <div className="bg-athfal-bright-yellow/20 rounded-full p-4 mb-4 group-hover:scale-105 transition-transform">
                  <img src="https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=100&h=100&fit=crop&auto=format" alt="Merchandise" className="w-10 h-10 object-cover rounded-full" />
                </div>
                <h3 className="font-semibold text-athfal-pink">Merchandise</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="athfal-container">
          <h2 className="text-3xl font-bold text-center mb-12 text-athfal-pink">
            {language === 'id' ? 'Produk Unggulan' : 'Featured Products'}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id}>
                  <Card className="athfal-card overflow-hidden h-full hover:scale-[1.02] transition-all">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop';
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 text-athfal-pink line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <p className="font-bold text-athfal-green">
                        {formatCurrency(product.price)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/products">
              <Button className="bg-athfal-pink hover:bg-athfal-pink/80 text-white py-2 px-6">
                {language === 'id' ? 'Lihat Semua Produk' : 'View All Products'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 bg-gradient-to-br from-athfal-light-pink/20 to-athfal-peach/30">
        <div className="athfal-container">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 text-athfal-pink">
                {language === 'id' ? 'Tentang Athfal Playhouse' : 'About Athfal Playhouse'}
              </h2>
              <p className="text-gray-700 mb-6">
                {language === 'id' 
                  ? 'Athfal Playhouse adalah tempat bermain dan belajar untuk anak-anak yang menyenangkan dan edukatif. Kami menyediakan berbagai program dan aktivitas yang dirancang untuk membantu perkembangan anak-anak baik secara kognitif maupun motorik.'
                  : 'Athfal Playhouse is a fun and educational play and learning space for children. We provide a variety of programs and activities designed to help children\'s development both cognitively and motorically.'
                }
              </p>
              <p className="text-gray-700 mb-6">
                {language === 'id'
                  ? 'Dengan metode pembelajaran yang interaktif dan menyenangkan, kami membantu anak-anak untuk mengembangkan kreativitas dan kemampuan berpikir kritis mereka sejak dini.'
                  : 'With interactive and fun learning methods, we help children develop their creativity and critical thinking skills from an early age.'
                }
              </p>
              <Link to="/about">
                <Button className="bg-athfal-teal hover:bg-athfal-teal/80 text-white py-2 px-6">
                  {language === 'id' ? 'Pelajari Lebih Lanjut' : 'Learn More'}
                </Button>
              </Link>
            </div>
            <div className="md:w-1/2 mt-6 md:mt-0">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1635107510862-53886e926b74?w=800&h=600&fit=crop&auto=format"
                    alt="Children playing"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-athfal-yellow rounded-full p-4 shadow-lg animate-bounce-slow">
                  <img
                    src="/lovable-uploads/4e490da3-e092-4eec-b20b-d66ed04832e7.png"
                    alt="Decorative element"
                    className="w-16 h-16"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
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
                  <Card key={testimonial.id} className="athfal-card h-full">
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

      {/* CTA Section */}
      <section className="py-16 bg-athfal-yellow/30">
        <div className="athfal-container text-center">
          <h2 className="text-3xl font-bold mb-6 text-athfal-pink">
            {language === 'id' ? 'Bergabung Sekarang' : 'Join Now'}
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            {language === 'id' 
              ? 'Temukan berbagai kegiatan menyenangkan dan edukatif untuk anak-anak Anda di Athfal Playhouse!'
              : 'Discover various fun and educational activities for your children at Athfal Playhouse!'
            }
          </p>
          <Link to="/products/pop-up-class">
            <Button className="bg-athfal-pink hover:bg-athfal-pink/80 text-white py-3 px-8 rounded-full text-lg">
              {language === 'id' ? 'Daftar Kelas' : 'Register for Classes'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
