import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    guardianStatus: '',
    paymentMethod: '',
    notes: '',
    childName: '',
    childAge: '',
    childBirthdate: '',
    childGender: ''
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

  const calculateAge = useCallback((birthdate: string): string => {
    if (!birthdate) return '';
    const birth = new Date(birthdate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    return parts.join(', ') || '0 days';
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'childBirthdate') {
        updated.childAge = calculateAge(value);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.paymentMethod) {
      alert('Please fill in all required fields');
      return;
    }

    // The order total reflects the FULL value of each sub-product (sum of all price
    // divisions). The first division is what the customer pays now (tracked server-side).
    const discountAmount = appliedPromo ? getDiscountAmount() : 0;
    const fullSubtotal = getFullSubtotal();
    const taxAmount = getFullTax();
    const totalAmount = Math.round(fullSubtotal) + Math.round(taxAmount) - Math.round(discountAmount);

    const result = await processOrder({
      ...formData,
      childName: formData.childName,
      childAge: formData.childAge,
      childBirthdate: formData.childBirthdate,
      childGender: formData.childGender,
      items,
      subtotal: Math.round(fullSubtotal),
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

      // Google Ads conversion tracking
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'conversion', {
          send_to: 'AW-18098383286/LojgCMGX7p0cELbT_bVD',
          value: Math.round(totalAmount),
          currency: 'IDR',
          transaction_id: result.orderId,
        });
      }

      const tokenParam = result.lookupToken ? `?token=${result.lookupToken}` : '';
      // Use replace to prevent back-button returning to empty checkout
      navigate(`/order-details/${result.orderId}${tokenParam}`, { replace: true });
    }
  };

  // Extract base product ID from composite cart ID (e.g., "PROD1__variant_xxx" -> "PROD1")
  const getBaseProductId = (cartId: string) => cartId.split('__')[0];

  // ---- Installment-aware pricing helpers ----
  // priceDivisions[0] is the first payment; the sum is the full sub-product price.
  const getDivisions = (item: typeof items[0]): number[] | undefined => {
    const divs = (item.product as any).priceDivisions as number[] | undefined;
    return Array.isArray(divs) && divs.length > 0 ? divs : undefined;
  };
  const isInstallmentItem = (item: typeof items[0]) => {
    const divs = getDivisions(item);
    return !!divs && divs.length > 1;
  };
  const lineFull = (item: typeof items[0]) => {
    const divs = getDivisions(item);
    const unit = divs ? divs.reduce((a, b) => a + (Number(b) || 0), 0) : item.product.price;
    return unit * item.quantity;
  };
  const lineFirstPayment = (item: typeof items[0]) => {
    const divs = getDivisions(item);
    const unit = divs ? (Number(divs[0]) || 0) : item.product.price;
    return unit * item.quantity;
  };
  const lineTax = (item: typeof items[0]) => {
    // Division-based sub-products are treated as tax-inclusive (no extra tax)
    if (getDivisions(item)) return 0;
    return item.product.price * item.quantity * (item.product.tax / 100);
  };

  const getFullSubtotal = () => items.reduce((sum, item) => sum + lineFull(item), 0);

  // Check if a cart item is eligible for the promo
  const isItemEligible = (item: typeof items[0]) => {
    if (!appliedPromo || appliedPromo.applies_to === 'all') return true;
    if (appliedPromo.applies_to === 'specific_products') {
      const baseId = getBaseProductId(item.product.id);
      return appliedPromo.applicable_product_ids.includes(baseId);
    }
    if (appliedPromo.applies_to === 'specific_categories') {
      return appliedPromo.applicable_category_slugs.includes(item.product.category);
    }
    return true;
  };

  // Calculate discount amount (only on eligible items), based on the full value
  const getDiscountAmount = () => {
    if (!appliedPromo) return 0;
    return items.reduce((total, item) => {
      if (!isItemEligible(item)) return total;
      return total + lineFull(item) * (appliedPromo.discount_percentage / 100);
    }, 0);
  };

  // Tax across the order (division items are tax-inclusive => 0), promo-aware
  const getFullTax = () => {
    return items.reduce((total, item) => {
      if (getDivisions(item)) return total;
      const eligible = appliedPromo && isItemEligible(item);
      const price = eligible
        ? item.product.price * (1 - appliedPromo!.discount_percentage / 100)
        : item.product.price;
      return total + price * item.quantity * (item.product.tax / 100);
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const discountAmount = appliedPromo ? getDiscountAmount() : 0;
  const fullSubtotal = getFullSubtotal();
  const taxAmount = getFullTax();
  const total = fullSubtotal + taxAmount - discountAmount;

  // Installment summary
  const hasInstallment = items.some(isInstallmentItem);
  const firstPaymentDueNow = Math.max(
    0,
    items.reduce((sum, item) => sum + (getDivisions(item) ? lineFirstPayment(item) : lineFull(item) + lineTax(item)), 0) - discountAmount,
  );
  const remainingLater = Math.max(0, total - firstPaymentDueNow);

  const summaryItems = items.map((item) => {
    const divs = getDivisions(item);
    return {
      id: item.product.id,
      name: item.name,
      quantity: item.quantity,
      price: divs ? divs.reduce((a, b) => a + (Number(b) || 0), 0) : item.product.price,
      firstPaymentUnit: divs ? (Number(divs[0]) || 0) : item.product.price,
      installments: divs && divs.length > 1 ? divs.length : 0,
    };
  });

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
