
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const AllProductsPage = () => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const { products, loading, error } = useProducts();
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return product.name.toLowerCase().includes(query) || 
           product.description.toLowerCase().includes(query);
  });

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

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="bg-athfal-peach/20 py-12">
        <div className="athfal-container">
          <h1 className="text-3xl md:text-4xl font-bold text-athfal-pink mb-4">
            {language === 'id' ? 'Semua Produk' : 'All Products'}
          </h1>
          <p className="text-gray-700 max-w-3xl">
            {language === 'id' 
              ? 'Jelajahi semua produk Athfal Playhouse untuk mendukung perkembangan anak Anda.'
              : 'Explore all Athfal Playhouse products to support your child\'s development.'}
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
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=400&fit=crop';
                      }}
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

export default AllProductsPage;
