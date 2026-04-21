
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Product } from "@/contexts/CartContext";
import { ProductMediaCarousel, ProductMedia } from "@/components/product/ProductMediaCarousel";
import { useProductVariants, ProductVariant } from "@/hooks/useProductVariants";

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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { variants, loading: variantsLoading } = useProductVariants(product.dbId);

  // Effective stock depends on whether a variant is selected
  const baseEffectiveStock = product.is_sold_out ? 0 : product.stock;
  const variantEffectiveStock = selectedVariant
    ? (selectedVariant.is_sold_out ? 0 : selectedVariant.stock)
    : 0;
  const effectiveStock = selectedVariant ? variantEffectiveStock : baseEffectiveStock;
  const activePrice = selectedVariant ? selectedVariant.price : product.price;

  const handleAddToCart = () => {
    const variantKey = selectedVariant ? `variant_${selectedVariant.id}` : 'normal';
    const cartId = `${product.id}__${variantKey}`;
    const cartStock = selectedVariant ? variantEffectiveStock : baseEffectiveStock;
    const cartProduct = selectedVariant 
      ? { ...product, id: cartId, price: selectedVariant.price, stock: cartStock, name: `${product.name} - ${selectedVariant.name}` }
      : { ...product, id: cartId, name: `${product.name} - Pembayaran Lunas` };
    addItem(cartProduct, quantity);
  };

  const handleBuyNow = () => {
    const variantKey = selectedVariant ? `variant_${selectedVariant.id}` : 'normal';
    const cartId = `${product.id}__${variantKey}`;
    const cartStock = selectedVariant ? variantEffectiveStock : baseEffectiveStock;
    const cartProduct = selectedVariant 
      ? { ...product, id: cartId, price: selectedVariant.price, stock: cartStock, name: `${product.name} - ${selectedVariant.name}` }
      : { ...product, id: cartId, name: `${product.name} - Pembayaran Lunas` };
    addItem(cartProduct, quantity);
    window.location.href = '/cart';
  };

  const increaseQuantity = () => {
    if (quantity < effectiveStock) setQuantity(quantity + 1);
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
        {effectiveStock <= 0 ? (
          <p className="text-2xl font-bold text-red-600 mb-4">SOLD OUT</p>
        ) : (
          <>
            <p className="text-2xl font-bold text-athfal-green mb-1">{formatCurrency(activePrice)}</p>
            {product.admission_date && (
              <p className="text-sm text-muted-foreground mb-4">
                📅 {language === 'id' ? 'Tanggal Masuk' : 'Admission Date'}: {new Date(product.admission_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {!product.admission_date && <div className="mb-4" />}
          </>
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
            <span className={`${effectiveStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {effectiveStock > 0
                ? (language === 'id' ? `${effectiveStock} tersedia` : `${effectiveStock} available`)
                : (language === 'id' ? 'Habis' : 'Out of stock')}
            </span>
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
              <span className="text-gray-600">
                {formatCurrency(product.installment)}
                {product.installment_months > 0 && (
                  <span> x{product.installment_months} {language === 'id' ? 'bulan' : 'months'}</span>
                )}
              </span>
            </div>
          )}
        </div>

        {effectiveStock > 0 ? (
          <>
            {/* Variant selector */}
            {!variantsLoading && variants.length > 0 && (
              <div className="mb-6">
                <label className="font-medium text-gray-700 block mb-3">
                  {language === 'id' ? 'Pilih Opsi' : 'Choose Option'}:
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedVariant(null)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedVariant === null
                        ? 'border-athfal-pink bg-athfal-pink/10 text-athfal-pink'
                        : 'border-gray-200 text-gray-600 hover:border-athfal-pink/50'
                    }`}
                  >
                    <span className="block">{language === 'id' ? 'Pembayaran Lunas' : 'Full Payment'}</span>
                    <span className="block text-xs mt-0.5">{formatCurrency(product.price)}</span>
                  </button>
                  {variants.map(variant => (
                    (() => {
                      const vEff = variant.is_sold_out ? 0 : variant.stock;
                      const isOut = vEff <= 0;
                      return (
                        <button
                          key={variant.id}
                          disabled={isOut}
                          onClick={() => { setSelectedVariant(variant); setQuantity(1); }}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                            selectedVariant?.id === variant.id
                              ? 'border-athfal-pink bg-athfal-pink/10 text-athfal-pink'
                              : 'border-gray-200 text-gray-600 hover:border-athfal-pink/50'
                          } ${isOut ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                        >
                          <span className="block">{variant.name}</span>
                          <span className="block text-xs mt-0.5">{formatCurrency(variant.price)}</span>
                          <span className="block text-[10px] mt-0.5 text-muted-foreground">
                            {isOut ? (language === 'id' ? 'Habis' : 'Sold out') : (language === 'id' ? `${vEff} tersedia` : `${vEff} left`)}
                          </span>
                        </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            )}

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
                  disabled={effectiveStock <= quantity}
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
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {language === 'id' ? 'Tambah ke Keranjang' : 'Add to Cart'}
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-1 bg-athfal-pink hover:bg-athfal-pink/80 text-white"
              >
                {language === 'id' ? 'Beli Sekarang' : 'Buy Now'}
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-600 font-bold text-lg mb-2">
              {language === 'id' ? 'Produk ini sudah habis' : 'This product is sold out'}
            </p>
            <p className="text-red-500 text-sm">
              {language === 'id' 
                ? 'Produk tidak dapat ditambahkan ke keranjang saat ini.' 
                : 'This product cannot be added to cart at this time.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductMainSection;
