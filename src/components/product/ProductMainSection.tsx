
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Product } from "@/contexts/CartContext";
import { ProductMediaCarousel, ProductMedia } from "@/components/product/ProductMediaCarousel";

interface ProductMainSectionProps {
  product: Product;
  language: string;
  addItem: (product: Product, quantity: number) => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);

const ProductMainSection: React.FC<ProductMainSectionProps> = ({ product, language, addItem }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => addItem(product, quantity);
  const handleBuyNow = () => {
    addItem(product, quantity);
    window.location.href = '/cart';
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  // Prepare media for carousel
  const media: ProductMedia[] = (product as any).media && (product as any).media.length > 0
    ? (product as any).media
    : [{ url: product.image, type: 'image' as const }];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Product media carousel */}
      <ProductMediaCarousel media={media} productName={product.name} />
      
      {/* Product info */}
      <div>
        <h1 className="text-3xl font-bold text-athfal-pink mb-2">{product.name}</h1>
        {product.stock <= 0 ? (
          <p className="text-2xl font-bold text-red-600 mb-4">SOLD OUT</p>
        ) : (
          <p className="text-2xl font-bold text-athfal-green mb-4">{formatCurrency(product.price)}</p>
        )}
        <div className="border-t border-b border-gray-200 py-4 my-6">
          <div className="flex items-center mb-4">
            <span className="font-medium text-gray-700 w-24">{language === 'id' ? 'Kategori' : 'Category'}:</span>
            <span className="text-gray-600">
              {product.category === 'pop-up-class' ? 'Pop Up Class' :
                product.category === 'bumi-class' ? 'Bumi Class' :
                product.category === 'tahsin-class' ? 'Tahsin Class' :
                product.category === 'play-kit' ? 'Play Kit' :
                product.category === 'consultation' ? 'Psychological Consultation' :
                'Merchandise & Others'}
            </span>
          </div>
          <div className="flex items-center mb-4">
            <span className="font-medium text-gray-700 w-24">{language === 'id' ? 'Stok' : 'Stock'}:</span>
            <span className={`${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0
                ? (language === 'id' ? `${product.stock} tersedia` : `${product.stock} available`)
                : (language === 'id' ? 'Habis' : 'Out of stock')}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700 w-24">{language === 'id' ? 'Pajak' : 'Tax'}:</span>
            <span className="text-gray-600">{product.tax}%</span>
          </div>
          {product.first_payment > 0 && (
            <div className="flex items-center mt-4">
              <span className="font-medium text-gray-700 w-24">{language === 'id' ? 'DP' : 'First Payment'}:</span>
              <span className="text-gray-600">{formatCurrency(product.first_payment)}</span>
            </div>
          )}
          {product.installment > 0 && (
            <div className="flex items-center mt-4">
              <span className="font-medium text-gray-700 w-24">{language === 'id' ? 'Cicilan' : 'Installment'}:</span>
              <span className="text-gray-600">{formatCurrency(product.installment)}</span>
            </div>
          )}
        </div>
        {/* Quantity selector */}
        <div className="mb-6">
          <label className="font-medium text-gray-700 block mb-2">
            {language === 'id' ? 'Jumlah' : 'Quantity'}:
          </label>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="mx-4 w-10 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={increaseQuantity}
              disabled={product.stock <= quantity}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="flex-1 border-athfal-pink text-athfal-pink hover:bg-athfal-pink/10"
            disabled={product.stock <= 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {language === 'id' ? 'Tambah ke Keranjang' : 'Add to Cart'}
          </Button>
          <Button
            onClick={handleBuyNow}
            className="flex-1 bg-athfal-pink hover:bg-athfal-pink/80 text-white"
            disabled={product.stock <= 0}
          >
            {language === 'id' ? 'Beli Sekarang' : 'Buy Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductMainSection;
