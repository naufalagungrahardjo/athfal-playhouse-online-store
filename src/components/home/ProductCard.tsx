import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { getThumbnailUrl } from '@/utils/imageThumbnail';

interface Product {
  id: string;
  dbId?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock?: number;
  is_sold_out?: boolean;
  admission_date?: string | null;
}

interface ProductCardProps {
  product: Product;
  lowestPrice?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const ProductCard = ({ product, lowestPrice }: ProductCardProps) => {
  const isSoldOut = product.is_sold_out || (product.stock !== undefined && product.stock <= 0);
  const displayPrice = lowestPrice !== undefined ? lowestPrice : product.price;
  const hasVariants = lowestPrice !== undefined && lowestPrice < product.price;

  return (
    <Link to={`/product/${product.id}`}>
      <Card className={`athfal-card overflow-hidden h-full hover:scale-[1.02] transition-all ${isSoldOut ? 'grayscale opacity-70' : ''}`}>
        <div className="aspect-square overflow-hidden relative">
          <img 
            src={getThumbnailUrl(product.image)} 
            alt={product.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
            width={400}
            height={400}
            onError={(e) => {
              // Fall back to the full-size original if no thumbnail exists
              // (older uploads), then to a neutral placeholder.
              const target = e.target as HTMLImageElement;
              if (product.image && target.src !== product.image) {
                target.src = product.image;
              } else {
                target.onerror = null;
                target.src = '/placeholder.svg';
              }
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
            <>
              <p className="font-bold text-athfal-green">
                {hasVariants && <span className="text-xs text-gray-500 font-normal mr-1">Mulai dari</span>}
                {formatCurrency(displayPrice)}
              </p>
              {product.admission_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  📅 Masuk: {new Date(product.admission_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
