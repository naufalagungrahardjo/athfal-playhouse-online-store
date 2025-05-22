
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCategory } from '@/contexts/CartContext';

// Mock data for banners - in production, these would come from an API
const MOCK_BANNERS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1655115295566-e23e5104386d',
    title: 'Pop Up Class',
    description: 'Belajar sambil bermain dengan metode Montessori',
    link: '/products/pop-up-class',
    linkText: 'Daftar Sekarang',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1472457897821-70d3819a0e24',
    title: 'Play Kit',
    description: 'Paket permainan edukatif untuk anak',
    link: '/products/play-kit',
    linkText: 'Beli Sekarang',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1576404425423-443e03992f31',
    title: 'Bumi Class',
    description: 'Kelas seru belajar tentang lingkungan',
    link: '/products/bumi-class',
    linkText: 'Ikuti Kelas',
  },
];

// Mock featured products
const FEATURED_PRODUCTS = [
  {
    id: '1',
    name: 'Pop Up Class - Usia 2-3 Tahun',
    description: 'Kelas untuk anak usia 2-3 tahun yang menyenangkan dan edukatif',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1588075592405-d68745302891',
    category: 'pop-up-class' as ProductCategory,
  },
  {
    id: '2',
    name: 'Bumi Class: Mengenal Alam',
    description: 'Kelas belajar mengenal alam untuk anak-anak',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1590592006475-d0264ad1ee92',
    category: 'bumi-class' as ProductCategory,
  },
  {
    id: '3',
    name: 'Play Kit - Alphabet Fun',
    description: 'Kit bermain sambil belajar alfabet untuk anak',
    price: 199000,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b',
    category: 'play-kit' as ProductCategory,
  },
  {
    id: '4',
    name: 'Konsultasi Anak 60 Menit',
    description: 'Sesi konsultasi psikologi anak dengan ahli',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651',
    category: 'consultation' as ProductCategory,
  },
];

// Mock testimonials
const TESTIMONIALS = [
  {
    id: '1',
    name: 'Ibu Sarah',
    text: 'Anak saya sangat senang mengikuti Pop Up Class. Dia jadi lebih aktif dan belajar banyak hal baru!',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: '2',
    name: 'Bapak Andi',
    text: 'Play Kit dari Athfal sangat membantu anak saya belajar sambil bermain di rumah. Edukatif dan berkualitas!',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
  },
  {
    id: '3',
    name: 'Ibu Lina',
    text: 'Konsultasi dengan psikolog anak sangat membantu saya memahami perkembangan anak. Recommended!',
    rating: 4,
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
];

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
  
  // In a real app, we'd fetch these from the API
  const [banners, setBanners] = useState(MOCK_BANNERS);
  const [featuredProducts, setFeaturedProducts] = useState(FEATURED_PRODUCTS);
  const [testimonials, setTestimonials] = useState(TESTIMONIALS);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner Carousel */}
      <section className="w-full">
        <Carousel className="w-full">
          <CarouselContent>
            {banners.map((banner) => (
              <CarouselItem key={banner.id}>
                <div 
                  className="relative h-[300px] md:h-[500px] w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${banner.image})` }}
                >
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-8 md:px-20">
                    <div className="max-w-xl text-white">
                      <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
                        {banner.title}
                      </h1>
                      <p className="text-lg md:text-xl mb-6 animate-slide-in">
                        {banner.description}
                      </p>
                      <Link to={banner.link}>
                        <Button className="bg-athfal-yellow hover:bg-athfal-yellow/80 text-black font-semibold px-6 py-2">
                          {banner.linkText}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </section>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id}>
                <Card className="athfal-card overflow-hidden h-full hover:scale-[1.02] transition-all">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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

          <div className="text-center mt-10">
            <Link to="/products/pop-up-class">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="athfal-card h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h3 className="font-semibold text-athfal-pink">{testimonial.name}</h3>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-${i < testimonial.rating ? 'yellow' : 'gray'}-400`}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic flex-grow">{testimonial.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
