import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useDatabase } from '@/hooks/useDatabase';
import { useOrderProcessing } from '@/hooks/useOrderProcessing';
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";

type PromoCode = {
  id: string;
  code: string;
  discount_percentage: number;
  description: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, getTotalTax, clearCart } = useCart();
  const { paymentMethods } = useDatabase();
  const { processOrder, processing } = useOrderProcessing();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: '',
    notes: ''
  });

  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const handleApplyPromo = (promo: PromoCode) => {
    setAppliedPromo(promo);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }

    // Load applied promo from localStorage if it exists
    const storedPromo = localStorage.getItem('appliedPromo');
    if (storedPromo) {
      try {
        const parsedPromo = JSON.parse(storedPromo);
        console.log('Loading stored promo:', parsedPromo);
        setAppliedPromo(parsedPromo);
      } catch (error) {
        console.error('Failed to parse stored promo', error);
        localStorage.removeItem('appliedPromo');
      }
    }
  }, [items, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.paymentMethod) {
      alert('Please fill in all required fields');
      return;
    }

    console.log('Processing order with payment method:', formData.paymentMethod);
    console.log('Available payment methods:', paymentMethods);

    const subtotal = appliedPromo ? getDiscountedSubtotal() : getTotalPrice();
    const taxAmount = appliedPromo ? getDiscountedTax() : getTotalTax();
    const totalAmount = subtotal + taxAmount;
    const discountAmount = appliedPromo ? getDiscountAmount() : 0;

    console.log('Order totals:', { subtotal, taxAmount, totalAmount, discountAmount });

    const result = await processOrder({
      ...formData,
      items,
      subtotal: Math.round(subtotal),
      taxAmount: Math.round(taxAmount),
      totalAmount: Math.round(totalAmount),
      promoCode: appliedPromo?.code || null,
      discountAmount: Math.round(discountAmount),
      promoCodeId: appliedPromo?.id || null
    });

    if (result.success) {
      clearCart();
      localStorage.removeItem('appliedPromo'); // Clear promo after successful order
      navigate(`/order-details/${result.orderId}`);
    }
  };

  // Calculate discount amount
  const getDiscountAmount = () => {
    if (!appliedPromo) return 0;
    const subtotal = getTotalPrice();
    return subtotal * (appliedPromo.discount_percentage / 100);
  };

  // Get discounted subtotal
  const getDiscountedSubtotal = () => {
    return getTotalPrice() - getDiscountAmount();
  };

  // Get tax on discounted amount
  const getDiscountedTax = () => {
    if (!appliedPromo) return getTotalTax();
    
    return items.reduce((total, item) => {
      const discountedPrice = item.product.price * (1 - (appliedPromo.discount_percentage / 100));
      const itemTax = (discountedPrice * item.quantity) * (item.product.tax / 100);
      return total + itemTax;
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const subtotal = appliedPromo ? getDiscountedSubtotal() : getTotalPrice();
  const taxAmount = appliedPromo ? getDiscountedTax() : getTotalTax();
  const total = subtotal + taxAmount;

  const activePaymentMethods = paymentMethods.filter(method => method.active);

  console.log('Available payment methods:', activePaymentMethods);
  console.log('Form payment method value:', formData.paymentMethod);
  console.log('Applied promo:', appliedPromo);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckoutForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  processing={processing}
                  activePaymentMethods={activePaymentMethods}
                  formatCurrency={formatCurrency}
                  total={total}
                />
              </CardContent>
            </Card>
          </div>
          {/* Order Summary */}
          <div>
            <OrderSummary
              items={items}
              appliedPromo={appliedPromo}
              getTotalPrice={getTotalPrice}
              getDiscountAmount={getDiscountAmount}
              taxAmount={taxAmount}
              total={total}
              formatCurrency={formatCurrency}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
