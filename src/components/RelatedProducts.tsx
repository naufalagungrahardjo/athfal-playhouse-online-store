
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { ProductCategory } from '@/contexts/CartContext';

interface RelatedProductsProps {
  currentProductId: string;
  currentCategory: ProductCategory;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const RelatedProducts = ({ currentProductId, currentCategory }: RelatedProductsProps) => {
  const { products, loading } = useProducts();

  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-2xl font-bold text-athfal-pink mb-6">Produk Terkait</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-3 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter products: same category but exclude current product
  const relatedProducts = products
    .filter(product => 
      product.category === currentCategory && 
      product.id !== currentProductId
    )
    .slice(0, 3); // Show only 3 related products

  if (relatedProducts.length === 0) {
    return null; // Don't show section if no related products
  }

  return (
    <div className="py-8">
      <h3 className="text-2xl font-bold text-athfal-pink mb-6">Produk Terkait</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedProducts.map((product) => (
          <Link to={`/product/${product.id}`} key={product.id}>
            <Card className={`athfal-card overflow-hidden h-full hover:scale-[1.02] transition-all ${product.stock !== undefined && product.stock <= 0 ? 'grayscale opacity-70' : ''}`}>
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
                {product.stock !== undefined && product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-lg">SOLD OUT</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold text-lg mb-2 text-athfal-pink line-clamp-2">
                  {product.name}
                </h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>
                {product.stock !== undefined && product.stock <= 0 ? (
                  <p className="font-bold text-red-600">SOLD OUT</p>
                ) : (
                  <p className="font-bold text-athfal-green">
                    {formatCurrency(product.price)}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
