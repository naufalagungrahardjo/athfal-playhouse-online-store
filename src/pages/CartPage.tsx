
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, getTaxAmount, getTotal } = useCart();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');

  const handleIncreaseQuantity = (productId: string, currentQuantity: number, maxStock: number) => {
    if (currentQuantity < maxStock) {
      updateQuantity(productId, currentQuantity + 1);
    }
  };

  const handleDecreaseQuantity = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleCheckout = () => {
    if (items.length > 0) {
      navigate('/checkout');
    }
  };

  const applyCoupon = () => {
    if (couponCode.trim() !== '') {
      // In a real app, this would call an API to validate the coupon
      alert(language === 'id' ? 'Kode kupon tidak valid' : 'Invalid coupon code');
      setCouponCode('');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-8">
          {language === 'id' ? 'Keranjang Belanja' : 'Shopping Cart'}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-athfal-peach/20 rounded-full h-24 w-24 mx-auto flex items-center justify-center mb-6">
              <ShoppingCart className="h-12 w-12 text-athfal-pink" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              {language === 'id' ? 'Keranjang Anda kosong' : 'Your cart is empty'}
            </h2>
            <p className="text-gray-600 mb-8">
              {language === 'id' 
                ? 'Tampaknya Anda belum menambahkan produk apapun ke keranjang.' 
                : 'Looks like you haven\'t added any products to your cart yet.'}
            </p>
            <Link to="/products/pop-up-class">
              <Button className="bg-athfal-pink hover:bg-athfal-pink/80 text-white">
                {language === 'id' ? 'Mulai Belanja' : 'Start Shopping'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <Card className="bg-white rounded-3xl shadow-md overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.product.id}>
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                          {/* Product image */}
                          <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Product details */}
                          <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <Link to={`/product/${item.product.id}`}>
                                <h3 className="font-semibold text-lg text-athfal-pink hover:text-athfal-pink/80">
                                  {item.product.name}
                                </h3>
                              </Link>
                              
                              <div className="mt-2 sm:mt-0">
                                <p className="font-bold text-athfal-green">
                                  {formatCurrency(item.product.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 text-sm mt-1 mb-3">
                              {item.product.category === 'pop-up-class' ? 'Pop Up Class' :
                               item.product.category === 'bumi-class' ? 'Bumi Class' :
                               item.product.category === 'tahsin-class' ? 'Tahsin Class' :
                               item.product.category === 'play-kit' ? 'Play Kit' :
                               item.product.category === 'consultation' ? 'Psychological Consultation' :
                               'Merchandise & Others'}
                            </p>
                            
                            <div className="flex justify-between items-center">
                              {/* Quantity selector */}
                              <div className="flex items-center">
                                <Button
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleDecreaseQuantity(item.product.id, item.quantity)}
                                  disabled={item.quantity <= 1}
                                  className="h-8 w-8"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="mx-3 w-6 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleIncreaseQuantity(item.product.id, item.quantity, item.product.stock)}
                                  disabled={item.product.stock <= item.quantity}
                                  className="h-8 w-8"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              {/* Remove button */}
                              <Button
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveItem(item.product.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">
                                  {language === 'id' ? 'Hapus' : 'Remove'}
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Separator className="mt-6" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={handleClearCart}
                      className="text-red-500 border-red-500 hover:bg-red-50"
                    >
                      {language === 'id' ? 'Kosongkan Keranjang' : 'Clear Cart'}
                    </Button>
                    <Link to="/products/pop-up-class">
                      <Button variant="outline">
                        {language === 'id' ? 'Lanjutkan Belanja' : 'Continue Shopping'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white rounded-3xl shadow-md overflow-hidden sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-athfal-pink mb-4">
                    {language === 'id' ? 'Ringkasan Pesanan' : 'Order Summary'}
                  </h3>

                  {/* Coupon code */}
                  <div className="mb-6">
                    <div className="flex gap-2">
                      <Input
                        placeholder={language === 'id' ? 'Kode kupon' : 'Coupon code'}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="athfal-input"
                      />
                      <Button 
                        onClick={applyCoupon}
                        disabled={!couponCode.trim()}
                        className="bg-athfal-yellow text-black hover:bg-athfal-yellow/80"
                      >
                        {language === 'id' ? 'Terapkan' : 'Apply'}
                      </Button>
                    </div>
                  </div>

                  {/* Price summary */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{language === 'id' ? 'Subtotal' : 'Subtotal'}</span>
                      <span>{formatCurrency(getSubtotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{language === 'id' ? 'Pajak' : 'Tax'}</span>
                      <span>{formatCurrency(getTaxAmount())}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between font-bold">
                      <span>{language === 'id' ? 'Total' : 'Total'}</span>
                      <span className="text-athfal-green">{formatCurrency(getTotal())}</span>
                    </div>
                  </div>

                  {/* Checkout button */}
                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-athfal-pink hover:bg-athfal-pink/80 text-white text-lg py-6"
                  >
                    {language === 'id' ? 'Lanjutkan ke Pembayaran' : 'Proceed to Checkout'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
