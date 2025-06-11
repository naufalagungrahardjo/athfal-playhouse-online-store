
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';

export const FeaturedProductsSection = () => {
  const { language } = useLanguage();
  const { products, loading } = useProducts();
  
  // Get featured products (first 4 products from database)
  const featuredProducts = products.slice(0, 4);

  return (
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
              <ProductCard key={product.id} product={product} />
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
  );
};
