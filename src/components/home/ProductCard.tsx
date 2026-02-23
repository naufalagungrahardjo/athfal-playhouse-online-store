import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock?: number;
}

interface ProductCardProps {
  product: Product;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const isSoldOut = product.stock !== undefined && product.stock <= 0;

  return (
    <Link to={`/product/${product.id}`}>
      <Card className={`athfal-card overflow-hidden h-full hover:scale-[1.02] transition-all ${isSoldOut ? 'grayscale opacity-70' : ''}`}>
        <div className="aspect-square overflow-hidden relative">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
            width={400}
            height={400}
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
};
