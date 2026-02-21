
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCategory } from '@/contexts/CartContext';
import { Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

// Get category titles (for display purposes)
const getCategoryTitle = (category: string): string => {
  switch(category) {
    case 'pop-up-class':
      return 'Pop Up Class';
    case 'bumi-class':
      return 'Bumi Class';
    case 'tahsin-class':
      return 'Tahsin Class';
    case 'play-kit':
      return 'Play Kit';
    case 'consultation':
      return 'Psychological Consultation';
    case 'merchandise':
      return 'Merchandise & Others';
    default:
      return category;
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ProductListPage = () => {
  const { category } = useParams<{ category: string }>();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const { products, loading, error, getProductsByCategory } = useProducts();
  
  // Get products for the current category
  const categoryProducts = category ? getProductsByCategory(category as ProductCategory) : [];
  
  // Filter products based on search query
  const filteredProducts = categoryProducts.filter(product => {
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return product.name.toLowerCase().includes(query) || 
           product.description.toLowerCase().includes(query);
  });

  // Get content based on the category
  const getCategoryDescription = (): string => {
    switch(category) {
      case 'pop-up-class':
        return language === 'id'
          ? 'Pop Up Class adalah kelas interaktif yang dirancang untuk mengembangkan kreativitas dan keterampilan anak-anak melalui berbagai aktivitas menarik.'
          : 'Pop Up Class is an interactive class designed to develop children\'s creativity and skills through various engaging activities.';
      case 'bumi-class':
        return language === 'id'
          ? 'Bumi Class mengajarkan anak-anak tentang lingkungan dan pentingnya menjaga alam melalui aktivitas praktis dan menyenangkan.'
          : 'Bumi Class teaches children about the environment and the importance of preserving nature through practical and fun activities.';
      case 'tahsin-class':
        return language === 'id'
          ? 'Tahsin Class adalah kelas untuk belajar membaca Al-Quran dengan baik dan benar, dengan metode yang menyenangkan untuk anak-anak.'
          : 'Tahsin Class is a class for learning to read the Quran properly and correctly, with a fun method for children.';
      case 'play-kit':
        return language === 'id'
          ? 'Play Kit adalah kit bermain edukatif yang dirancang untuk membantu anak-anak belajar sambil bermain di rumah.'
          : 'Play Kit is an educational play kit designed to help children learn while playing at home.';
      case 'consultation':
        return language === 'id'
          ? 'Konsultasi psikologi anak dengan ahli untuk membantu perkembangan dan kesehatan mental anak Anda.'
          : 'Child psychology consultation with experts to help your child\'s development and mental health.';
      case 'merchandise':
        return language === 'id'
          ? 'Berbagai merchandise Athfal Playhouse yang lucu dan bermanfaat untuk anak-anak.'
          : 'Various cute and useful Athfal Playhouse merchandise for children.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div>Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const categoryTitle = getCategoryTitle(category || '');
  const categoryDescription = getCategoryDescription();

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="bg-athfal-peach/20 py-12">
        <div className="athfal-container">
          <h1 className="text-3xl md:text-4xl font-bold text-athfal-pink mb-4">
            {categoryTitle}
          </h1>
          <p className="text-gray-700 max-w-3xl">
            {categoryDescription}
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="athfal-container py-12">
        {/* Search bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={language === 'id' ? 'Cari produk...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="athfal-input pl-10"
            />
          </div>
        </div>

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {language === 'id' 
                ? 'Tidak ada produk ditemukan' 
                : 'No products found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const isSoldOut = product.stock <= 0;
              return (
              <Link to={`/product/${product.id}`} key={product.id}>
                <Card className={`athfal-card overflow-hidden h-full hover:scale-[1.02] transition-all ${isSoldOut ? 'grayscale opacity-70' : ''}`}>
                  <div className="aspect-square overflow-hidden relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-lg">SOLD OUT</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-athfal-pink line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    {isSoldOut ? (
                      <p className="font-bold text-red-600">SOLD OUT</p>
                    ) : (
                      <p className="font-bold text-athfal-green">
                        {formatCurrency(product.price)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
