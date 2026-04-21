
import { Button } from "@/components/ui/button";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Product } from "@/contexts/CartContext";
import { ProductMediaCarousel, ProductMedia } from "@/components/product/ProductMediaCarousel";
import { useProductVariants, ProductVariant } from "@/hooks/useProductVariants";
import { useProductSessions } from "@/hooks/useProductSessions";
import { useInstallmentPlans, InstallmentPlan } from "@/hooks/useInstallmentPlans";

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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const { variants, loading: variantsLoading } = useProductVariants(product.dbId);
  const { sessions } = useProductSessions((product as any).use_sessions ? product.dbId : undefined);
  const { plans } = useInstallmentPlans(product.dbId);

  const useSessions = !!(product as any).use_sessions && sessions.length > 0;
  const selectedSession = useSessions ? sessions.find(s => s.id === selectedSessionId) : null;
  const sessionStock = selectedSession ? (selectedSession.is_sold_out ? 0 : selectedSession.stock) : product.stock;

  // If admin toggled sold out, treat stock as 0 for customers
  const effectiveStock = product.is_sold_out
    ? 0
    : (useSessions ? (selectedSession ? sessionStock : Math.max(...sessions.map(s => s.is_sold_out ? 0 : s.stock), 0)) : product.stock);
  const activePrice = selectedVariant ? selectedVariant.price : product.price;

  const handleAddToCart = () => {
    if (useSessions && !selectedSession) return;
    if (plans.length > 0 && !selectedPlan) return;
    const variantKey = selectedVariant ? `variant_${selectedVariant.id}` : 'normal';
    const sessionKey = selectedSession ? `__sess_${selectedSession.id}` : '';
    const planKey = selectedPlan ? `__plan_${selectedPlan.id}` : '';
    const cartId = `${product.id}__${variantKey}${sessionKey}${planKey}`;
    const planLabel = selectedPlan ? ` - ${selectedPlan.name}` : '';
    const sessionLabel = selectedSession ? ` (${selectedSession.name})` : '';
    const cartProduct = selectedVariant
      ? { ...product, id: cartId, price: selectedVariant.price, name: `${product.name} - ${selectedVariant.name}${sessionLabel}${planLabel}`, stock: useSessions ? sessionStock : product.stock }
      : { ...product, id: cartId, name: `${product.name}${sessionLabel}${planLabel || ' - Pembayaran Lunas'}`, stock: useSessions ? sessionStock : product.stock };
    addItem(cartProduct, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    if (useSessions && !selectedSession) return;
    if (plans.length > 0 && !selectedPlan) return;
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
            {/* Session selector */}
            {useSessions && (
              <div className="mb-6">
                <label className="font-medium text-gray-700 block mb-3">
                  {language === 'id' ? 'Pilih Sesi' : 'Choose Session'}:
                </label>
                <div className="flex flex-wrap gap-3">
                  {sessions.map(s => {
                    const stk = s.is_sold_out ? 0 : s.stock;
                    const disabled = stk <= 0;
                    return (
                      <button
                        key={s.id}
                        disabled={disabled}
                        onClick={() => { setSelectedSessionId(s.id); setQuantity(1); }}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          selectedSessionId === s.id
                            ? 'border-athfal-pink bg-athfal-pink/10 text-athfal-pink'
                            : disabled
                              ? 'border-gray-200 text-gray-400 line-through cursor-not-allowed'
                              : 'border-gray-200 text-gray-600 hover:border-athfal-pink/50'
                        }`}
                      >
                        <span className="block">{s.name}</span>
                        <span className="block text-xs mt-0.5">
                          {disabled ? (language === 'id' ? 'Habis' : 'Sold out') : `${stk} ${language === 'id' ? 'tersisa' : 'left'}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment plan selector */}
            {plans.length > 0 && (
              <div className="mb-6">
                <label className="font-medium text-gray-700 block mb-3">
                  {language === 'id' ? 'Pilih Pembayaran' : 'Choose Payment Plan'}:
                </label>
                <div className="flex flex-wrap gap-3">
                  {plans.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedPlan?.id === p.id
                          ? 'border-athfal-pink bg-athfal-pink/10 text-athfal-pink'
                          : 'border-gray-200 text-gray-600 hover:border-athfal-pink/50'
                      }`}
                    >
                      <span className="block">{p.name}</span>
                      <span className="block text-xs mt-0.5">{p.num_payments}x {language === 'id' ? 'pembayaran' : 'payment'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-athfal-pink bg-athfal-pink/10 text-athfal-pink'
                          : 'border-gray-200 text-gray-600 hover:border-athfal-pink/50'
                      }`}
                    >
                      <span className="block">{variant.name}</span>
                      <span className="block text-xs mt-0.5">{formatCurrency(variant.price)}</span>
                    </button>
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
