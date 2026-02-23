import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  applies_to: string;
  applicable_product_ids: string[];
  applicable_category_slugs: string[];
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, getTotalTax, clearCart } = useCart();
  const { paymentMethods } = useDatabase();
  const { processOrder, processing } = useOrderProcessing();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: '',
    notes: '',
    childAge: '',
    childBirthdate: ''
  });

  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [autofillEnabled, setAutofillEnabled] = useState(false);
  const orderCompletedRef = useRef(false);

  // Load user profile data when autofill is enabled
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, phone, address')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          customerName: data.name || '',
          customerEmail: data.email || '',
          customerPhone: data.phone || '',
          customerAddress: data.address || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleAutofillToggle = (enabled: boolean) => {
    setAutofillEnabled(enabled);
    if (enabled) {
      loadUserProfile();
    } else {
      // Clear form when autofill is disabled
      setFormData(prev => ({
        ...prev,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: ''
      }));
    }
  };

  const handleApplyPromo = (promo: PromoCode) => {
    setAppliedPromo(promo);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  useEffect(() => {
    if (items.length === 0 && !orderCompletedRef.current) {
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
      childAge: formData.childAge,
      childBirthdate: formData.childBirthdate,
      items,
      subtotal: Math.round(subtotal),
      taxAmount: Math.round(taxAmount),
      totalAmount: Math.round(totalAmount),
      promoCode: appliedPromo?.code || null,
      discountAmount: Math.round(discountAmount),
      promoCodeId: appliedPromo?.id || null
    });

    if (result.success) {
      orderCompletedRef.current = true;
      clearCart();
      localStorage.removeItem('appliedPromo');
      const tokenParam = result.lookupToken ? `?token=${result.lookupToken}` : '';
      navigate(`/order-details/${result.orderId}${tokenParam}`);
    }
  };

  // Check if a cart item is eligible for the promo
  const isItemEligible = (item: typeof items[0]) => {
    if (!appliedPromo || appliedPromo.applies_to === 'all') return true;
    if (appliedPromo.applies_to === 'specific_products') {
      return appliedPromo.applicable_product_ids.includes(item.product.id);
    }
    if (appliedPromo.applies_to === 'specific_categories') {
      return appliedPromo.applicable_category_slugs.includes(item.product.category);
    }
    return true;
  };

  // Calculate discount amount (only on eligible items)
  const getDiscountAmount = () => {
    if (!appliedPromo) return 0;
    return items.reduce((total, item) => {
      if (!isItemEligible(item)) return total;
      const itemSubtotal = item.product.price * item.quantity;
      return total + itemSubtotal * (appliedPromo.discount_percentage / 100);
    }, 0);
  };

  // Get discounted subtotal
  const getDiscountedSubtotal = () => {
    return getTotalPrice() - getDiscountAmount();
  };

  // Get tax on discounted amount
  const getDiscountedTax = () => {
    if (!appliedPromo) return getTotalTax();
    
    return items.reduce((total, item) => {
      const eligible = isItemEligible(item);
      const price = eligible
        ? item.product.price * (1 - (appliedPromo.discount_percentage / 100))
        : item.product.price;
      const itemTax = (price * item.quantity) * (item.product.tax / 100);
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
                  autofillEnabled={autofillEnabled}
                  onAutofillToggle={handleAutofillToggle}
                  isLoggedIn={!!user}
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
